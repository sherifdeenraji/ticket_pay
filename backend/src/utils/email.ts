import axios, { AxiosError } from 'axios';
import { Resend } from 'resend';
import { config } from '../config/env.js';

// ---------------------------------------------------------------------------
// Provider clients
// ---------------------------------------------------------------------------

const resendClient = config.RESEND.API_KEY
    ? new Resend(config.RESEND.API_KEY)
    : null;

const MAILTRAP_API_URL = 'https://send.api.mailtrap.io/api/send';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resend error names that mean the quota/limit is exhausted and we should
 * fall through to Mailtrap. All other Resend errors are fatal.
 * @see https://resend.com/docs/api-reference/errors
 */
const RESEND_QUOTA_ERRORS = new Set([
    'monthly_quota_exceeded',
    'daily_quota_exceeded',
    'rate_limit_exceeded',
]);

function isResendQuotaError(error: { name?: string } | null | undefined): boolean {
    return !!error?.name && RESEND_QUOTA_ERRORS.has(error.name);
}

/** Mailtrap API error keywords that indicate quota exhaustion */
const MAILTRAP_QUOTA_KEYWORDS = ['quota', 'limit exceeded', 'rate', 'blocked', 'exceeded'];

function isMailtrapQuotaError(err: unknown): boolean {
    if (err instanceof AxiosError) {
        if (err.response?.status === 429) return true;
        const body = JSON.stringify(err.response?.data ?? '').toLowerCase();
        return MAILTRAP_QUOTA_KEYWORDS.some((kw) => body.includes(kw));
    }
    return false;
}

// ---------------------------------------------------------------------------
// sendEmail — Resend first, Mailtrap fallback on quota exhaustion
// ---------------------------------------------------------------------------

export const sendEmail = async (
    to: string,
    subject: string,
    html: string,
): Promise<void> => {

    // --- Primary: Resend ---
    if (resendClient) {
        try {
            const { data, error } = await resendClient.emails.send({
                from: config.RESEND.FROM,
                to,
                subject,
                html,
            });

            if (error) {
                if (isResendQuotaError(error)) {
                    // Quota hit — fall through to Mailtrap
                    console.warn(
                        `[email] ⚠️  Resend quota limit reached (${error.name}) — switching to Mailtrap fallback.`,
                    );
                } else {
                    // Any other Resend error (bad key, domain not verified, etc.) — fail fast
                    console.error(`[email] ❌ Resend error [${error.name}]:`, error.message);
                    throw new Error(`Email delivery failed: ${error.message}`);
                }
            } else {
                console.log(`[email] ✅ Sent via Resend — id: ${data?.id}`);
                return;
            }
        } catch (err) {
            // Re-throw errors we already wrapped above
            if (err instanceof Error && err.message.startsWith('Email delivery failed')) throw err;
            // Unexpected SDK/network error — fall through to Mailtrap
            console.warn('[email] ⚠️  Resend unexpected error — switching to Mailtrap fallback.', err);
        }
    } else {
        console.warn('[email] ⚠️  RESEND_API_KEY not set — skipping Resend, using Mailtrap directly.');
    }

    // --- Fallback: Mailtrap Transactional HTTP API ---
    try {
        const response = await axios.post(
            MAILTRAP_API_URL,
            {
                from: {
                    email: config.MAILTRAP.FROM,
                    name: config.MAILTRAP.FROM_NAME,
                },
                to: [{ email: to }],
                subject,
                html,
            },
            {
                headers: {
                    'Authorization': `Bearer ${config.MAILTRAP.TOKEN}`,
                    'Content-Type': 'application/json',
                },
            },
        );

        const ids = (response.data?.message_ids ?? []).join(', ');
        console.log(`[email] ✅ Sent via Mailtrap (fallback) — message_id(s): ${ids || 'n/a'}`);
    } catch (mailtrapErr) {
        const detail =
            mailtrapErr instanceof AxiosError
                ? JSON.stringify(mailtrapErr.response?.data)
                : String(mailtrapErr);

        if (isMailtrapQuotaError(mailtrapErr)) {
            console.error(`[email] ❌ Mailtrap quota also exceeded. All providers exhausted. Detail: ${detail}`);
        } else {
            console.error(`[email] ❌ Mailtrap delivery error: ${detail}`);
        }

        throw new Error('Email delivery failed: all providers exhausted');
    }
};

// ---------------------------------------------------------------------------
// Email Templates
// ---------------------------------------------------------------------------
export const emailTemplates = {
    accountVerification: (userName: string, verificationLink: string) => `
        <h2>Welcome to TicketPay, ${userName}!</h2>
        <p>Please verify your email address to complete your registration.</p>
        <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            Verify Email
        </a>
        <p>If the button doesn't work, copy this link: ${verificationLink}</p>
    `,

    walletFunded: (userName: string, amount: number, balance: number) => `
        <h2>Wallet Funded Successfully!</h2>
        <p>Hi ${userName},</p>
        <p>Your wallet has been funded with <strong>₦${amount.toLocaleString()}</strong></p>
        <p>Your new wallet balance is: <strong>₦${balance.toLocaleString()}</strong></p>
        <p>You can now use your wallet to pay for rides on TicketPay.</p>
    `,

    paymentConfirmation: (userName: string, driverName: string, ticketCount: number, amount: number, transactionId: string) => `
        <h2>Payment Confirmation</h2>
        <p>Hi ${userName},</p>
        <p>Your payment has been processed successfully!</p>
        <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 10px; font-weight: bold;">Driver:</td>
                <td style="padding: 10px;">${driverName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 10px; font-weight: bold;">Tickets:</td>
                <td style="padding: 10px;">${ticketCount}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 10px; font-weight: bold;">Amount:</td>
                <td style="padding: 10px;">₦${amount.toLocaleString()}</td>
            </tr>
            <tr>
                <td style="padding: 10px; font-weight: bold;">Transaction ID:</td>
                <td style="padding: 10px; font-family: monospace;">${transactionId}</td>
            </tr>
        </table>
        <p>Keep this confirmation for your records.</p>
    `,

    passwordChanged: (userName: string) => `
        <h2>Password Changed</h2>
        <p>Hi ${userName},</p>
        <p>Your password has been successfully changed.</p>
        <p>If you did not request this change, please contact our support team immediately.</p>
        <p>Regards,<br>TicketPay Team</p>
    `,

    passwordReset: (userName: string, resetLink: string) => `
        <h2>Reset Your Password</h2>
        <p>Hi ${userName},</p>
        <p>We received a request to reset your TicketPay password. Click the link below to proceed:</p>
        <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            Reset Password
        </a>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request this, please ignore this email.</p>
    `,
};
