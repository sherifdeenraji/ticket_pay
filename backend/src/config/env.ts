import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

// ---------------------------------------------------------------------------
// Schema — required fields have no default and will fail if unset
// ---------------------------------------------------------------------------
const envSchema = z.object({
    // Server
    PORT: z.coerce.number().default(5000),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

    // Database
    DB_USER: z.string().min(1),
    DB_PASSWORD: z.string().min(1),
    DB_HOST: z.string().default('localhost'),
    DB_PORT: z.coerce.number().default(5432),
    DB_NAME: z.string().default('ticketpay'),

    // JWT
    JWT_SECRET: z.string().min(1),
    ADMIN_JWT_SECRET: z.string().min(1),
    JWT_EXPIRES_IN: z.string().default('1d'),

    // Admin credentials
    ADMIN_USERNAME: z.string().default('admin'),
    ADMIN_PASSWORD: z.string().default('adminpassword'),

    // Google OAuth
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    GOOGLE_CALLBACK_URL: z.string().url(),

    // Mail — Mailtrap Transactional API (primary)
    MAILTRAP_TOKEN: z.string().min(1),
    MAIL_FROM: z.string().email(),
    MAIL_FROM_NAME: z.string().default('TicketPay'),

    // Mail — Resend (fallback, optional but recommended)
    RESEND_API_KEY: z.string().optional(),
    RESEND_FROM: z.string().optional(),

    // Nomba payment
    NOMBA_CLIENT_ID: z.string().min(1),
    NOMBA_CLIENT_SECRET: z.string().min(1),
    NOMBA_ACCOUNT_ID: z.string().min(1),
    NOMBA_SUB_ACCOUNT_ID: z.string().min(1),
    NOMBA_WEBHOOK_SECRET: z.string().min(1),
    NOMBA_BASE_URL: z.string().url().default('https://api.nomba.com'),

    // Redis
    REDIS_HOST: z.string().default('localhost'),
    REDIS_PORT: z.coerce.number().default(6379),

    // Frontend URLs
    STUDENT_FRONTEND_URL: z.string().url().default('http://localhost:3000'),
    ADMIN_FRONTEND_URL: z.string().url().default('http://localhost:3001'),
});

// ---------------------------------------------------------------------------
// Parse & validate — exit immediately on failure with a clear error report
// ---------------------------------------------------------------------------
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    const issues = parsed.error.issues;

    console.error('\n❌  Environment validation failed — server cannot start.\n');
    console.error('The following environment variables are missing or invalid:\n');

    // Build a nice table
    const rows = issues.map((issue) => ({
        variable: issue.path.join('.'),
        problem: issue.message,
    }));

    const maxVar = Math.max(...rows.map((r) => r.variable.length), 'VARIABLE'.length);
    const maxMsg = Math.max(...rows.map((r) => r.problem.length), 'PROBLEM'.length);

    const line = `  ${'─'.repeat(maxVar + 2)}┼${'─'.repeat(maxMsg + 2)}`;
    const header = `  ${'VARIABLE'.padEnd(maxVar)}  │  ${'PROBLEM'.padEnd(maxMsg)}`;

    console.error(header);
    console.error(line);
    rows.forEach(({ variable, problem }) => {
        console.error(`  ${variable.padEnd(maxVar)}  │  ${problem}`);
    });

    console.error('\nPlease set the missing values in your .env file and restart.\n');
    process.exit(1);
}

const env = parsed.data;

// ---------------------------------------------------------------------------
// Export structured config (same shape as before)
// ---------------------------------------------------------------------------
export const config = {
    PORT: env.PORT,
    NODE_ENV: env.NODE_ENV,
    DB: {
        USER: env.DB_USER,
        PASSWORD: env.DB_PASSWORD,
        HOST: env.DB_HOST,
        PORT: env.DB_PORT,
        NAME: env.DB_NAME,
    },
    JWT: {
        USER_SECRET: env.JWT_SECRET,
        ADMIN_SECRET: env.ADMIN_JWT_SECRET,
        EXPIRES_IN: env.JWT_EXPIRES_IN,
    },
    ADMIN: {
        USERNAME: env.ADMIN_USERNAME,
        PASSWORD: env.ADMIN_PASSWORD,
    },
    GOOGLE: {
        CLIENT_ID: env.GOOGLE_CLIENT_ID,
        CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET,
        CALLBACK_URL: env.GOOGLE_CALLBACK_URL,
    },
    MAILTRAP: {
        TOKEN: env.MAILTRAP_TOKEN,
        FROM: env.MAIL_FROM,
        FROM_NAME: env.MAIL_FROM_NAME,
    },
    RESEND: {
        API_KEY: env.RESEND_API_KEY,
        FROM: env.RESEND_FROM ?? env.MAIL_FROM,
    },
    NOMBA: {
        CLIENT_ID: env.NOMBA_CLIENT_ID,
        CLIENT_SECRET: env.NOMBA_CLIENT_SECRET,
        ACCOUNT_ID: env.NOMBA_ACCOUNT_ID,
        SUB_ACCOUNT_ID: env.NOMBA_SUB_ACCOUNT_ID,
        WEBHOOK_SECRET: env.NOMBA_WEBHOOK_SECRET,
        BASE_URL: env.NOMBA_BASE_URL,
    },
    FRONTEND: {
        STUDENT: env.STUDENT_FRONTEND_URL,
        ADMIN: env.ADMIN_FRONTEND_URL,
    },
    REDIS: {
        HOST: env.REDIS_HOST,
        PORT: env.REDIS_PORT,
    },
};
