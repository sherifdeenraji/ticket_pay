import axios from "axios";
import { config } from "./env.js";

let cachedToken: string | null = null;
let tokenExpiryTime: number = 0;

export const getNombaAccessToken = async (): Promise<string> => {
  const now = Date.now();
  // If we have a cached token and it hasn't expired yet (with a 60-second buffer), use it
  if (cachedToken && tokenExpiryTime > now + 60000) {
    return cachedToken;
  }

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
    // send an email to the admin to check as this is a critical failure
    throw new Error(`Failed to obtain Nomba access token: ${JSON.stringify(response.data)}`);
  }

  cachedToken = tokenData.access_token as string;
  // expires_in is in seconds, convert to millisecond timestamp
  const expiresLimit = tokenData.expires_in || 86400;
  tokenExpiryTime = now + expiresLimit * 1000;

  return cachedToken;
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
