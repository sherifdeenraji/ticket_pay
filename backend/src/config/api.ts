import axios from "axios";
import { config } from "./env.js";

import redis from "./redis.js";

export const getNombaAccessToken = async (): Promise<string> => {
  // 1. Try to get the active cached access token (which is cached for 25 minutes)
  const cachedAccessToken = await redis.get("nomba:access_token");
  if (cachedAccessToken) {
    return cachedAccessToken;
  }

  // 2. If expired/missing, check if we have a refresh token and the expired access token to renew it
  const cachedRefreshToken = await redis.get("nomba:refresh_token");
  const expiredAccessToken = await redis.get("nomba:expired_access_token");

  if (cachedRefreshToken) {
    try {
      console.log("Nomba access token expired. Attempting to refresh token using refresh_token...");
      const response = await axios.post(
        `${config.NOMBA.BASE_URL}/v1/auth/token/refresh`,
        {
          grant_type: "refresh_token",
          refresh_token: cachedRefreshToken,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${expiredAccessToken || ""}`,
            "accountId": config.NOMBA.ACCOUNT_ID,
          },
        }
      );

      const tokenData = response.data?.data;
      if (tokenData?.access_token) {
        const newAccessToken = tokenData.access_token;
        const newRefreshToken = tokenData.refresh_token || cachedRefreshToken;

        // Cache the active access token for 25 minutes (1500 seconds)
        await redis.setex("nomba:access_token", 1500, newAccessToken);
        // Keep the access token for up to 30 minutes (1800 seconds) to use for subsequent refresh requests
        await redis.setex("nomba:expired_access_token", 1800, newAccessToken);
        // Cache the refresh token (longer TTL, e.g. 30 days)
        await redis.setex("nomba:refresh_token", 30 * 24 * 60 * 60, newRefreshToken);

        console.log("Nomba access token refreshed successfully via refresh_token!");
        return newAccessToken;
      }
    } catch (refreshErr: any) {
      console.error(
        "Failed to refresh Nomba token, falling back to complete re-issue:",
        refreshErr.response?.data || refreshErr.message
      );
    }
  }

  // 3. Complete re-issue if refresh token doesn't exist or refresh fails
  console.log("Requesting fresh Nomba token issue (grant_type: client_credentials)...");
  const response = await axios.post(
    `${config.NOMBA.BASE_URL}/v1/auth/token/issue`,
    {
      grant_type: "client_credentials",
      client_id: config.NOMBA.CLIENT_ID,
      client_secret: config.NOMBA.CLIENT_SECRET,
    },
    {
      headers: {
        "Content-Type": "application/json",
        "accountId": config.NOMBA.ACCOUNT_ID,
      },
    }
  );

  const tokenData = response.data?.data;
  if (!tokenData?.access_token) {
    throw new Error(`Failed to obtain Nomba access token: ${JSON.stringify(response.data)}`);
  }

  const newAccessToken = tokenData.access_token;
  const newRefreshToken = tokenData.refresh_token;

  // Cache access token for 25 minutes (1500 seconds)
  await redis.setex("nomba:access_token", 1500, newAccessToken);
  // Keep the access token for up to 30 minutes (1800 seconds) to use for subsequent refresh requests
  await redis.setex("nomba:expired_access_token", 1800, newAccessToken);
  
  if (newRefreshToken) {
    // Cache refresh token for 30 days
    await redis.setex("nomba:refresh_token", 30 * 24 * 60 * 60, newRefreshToken);
  }

  console.log("New Nomba access token issued and cached successfully!");
  return newAccessToken;
};

export interface VirtualAccountResult {
  account_number: string;
  account_name: string;
  account_reference: string;
  bank_name: string;
}

export const createNewVirtualAccount = async (
  email: string,
  firstName: string,
  lastName: string,
  phone: string
): Promise<VirtualAccountResult> => {
  const token = await getNombaAccessToken();
  // Account reference must be between 16-64 characters
  const timestamp = Date.now();
  const randomPart = Math.floor(100000 + Math.random() * 900000);
  const accountRef = `REF-${timestamp}-${randomPart}`;

  const response = await axios.post(
    `${config.NOMBA.BASE_URL}/v1/accounts/virtual/${config.NOMBA.SUB_ACCOUNT_ID}`,
    {
      accountRef,
      accountName: `${firstName} ${lastName}`,
    },
    {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "accountId": config.NOMBA.ACCOUNT_ID,
      },
    }
  );
 
  const resData = response.data;
  if (resData.code !== "00" || !resData.data) {
    throw new Error(`Failed to generate Nomba virtual account: ${resData.description || JSON.stringify(resData)}`);
  }

  return {
    account_number: resData.data.bankAccountNumber,
    account_name: resData.data.bankAccountName,
    account_reference: resData.data.accountRef,
    bank_name: resData.data.bankName,
  };
};
