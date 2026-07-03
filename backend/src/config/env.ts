import dotenv from 'dotenv';

dotenv.config();

export const config = {
    PORT: process.env.PORT || 5000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    DB: {
        USER: process.env.DB_USER,
        PASSWORD: process.env.DB_PASSWORD,
        HOST: process.env.DB_HOST || 'localhost',
        PORT: parseInt(process.env.DB_PORT || '5432'),
        NAME: process.env.DB_NAME || 'ticketpay',
    },
    JWT: {
        USER_SECRET: process.env.JWT_SECRET || 'user-fallback-secret',
        ADMIN_SECRET: process.env.ADMIN_JWT_SECRET || 'admin-fallback-secret',
        EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
    },
    ADMIN: {
        USERNAME: process.env.ADMIN_USERNAME || 'admin',
        PASSWORD: process.env.ADMIN_PASSWORD || 'adminpassword',
    },
    GOOGLE: {
        CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
        CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
        CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,
    },
    MAILTRAP: {
        HOST: process.env.MAIL_HOST,
        PORT: parseInt(process.env.MAIL_PORT || '587'),
        USER: process.env.MAIL_USER,
        PASS: process.env.MAIL_PASS,
        FROM: process.env.MAIL_FROM,
    },
    NOMBA: {
        CLIENT_ID: process.env.NOMBA_CLIENT_ID,
        CLIENT_SECRET: process.env.NOMBA_CLIENT_SECRET,
        ACCOUNT_ID: process.env.NOMBA_ACCOUNT_ID,
        WEBHOOK_SECRET: process.env.NOMBA_WEBHOOK_SECRET,
        BASE_URL: process.env.NOMBA_BASE_URL || 'https://api.nomba.com',
    },
    FRONTEND: {
        STUDENT: process.env.STUDENT_FRONTEND_URL || 'http://localhost:3000',
        ADMIN: process.env.ADMIN_FRONTEND_URL || 'http://localhost:3001',
    },
};
