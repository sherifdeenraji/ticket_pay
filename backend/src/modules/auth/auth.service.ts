import { db } from '../../config/db.js';
import { createNewVirtualAccount } from '../../config/api.js';

export interface User {
    id: number;
    firstname: string;
    lastname: string;
    fullname?: string;
    phone_number?: string;
    email: string;
    password?: string;
    google_id?: string;
    avatar_url?: string;
    email_verified: boolean;
    status: 'active' | 'suspended';
    wallet_balance: number;
    has_wallet: boolean;
    account_number?: string;
    account_name?: string;
    bank_name?: string;
    created_at: Date;
}

export const userService = {
    findByEmail: async (email: string): Promise<User | null> => {
        const result = await db.query(
            `SELECT u.*, COALESCE(w.balance, 0) AS wallet_balance,
                    (w.account_number IS NOT NULL) AS has_wallet,
                    w.account_number, w.account_name, w.bank_name
             FROM users u
             LEFT JOIN wallets w ON w.user_id = u.id
             WHERE u.email = $1`,
            [email]
        );
        return result.rows[0] || null;
    },

    findById: async (id: number): Promise<User | null> => {
        const result = await db.query(
            `SELECT u.*, COALESCE(w.balance, 0) AS wallet_balance,
                    (w.account_number IS NOT NULL) AS has_wallet,
                    w.account_number, w.account_name, w.bank_name
             FROM users u
             LEFT JOIN wallets w ON w.user_id = u.id
             WHERE u.id = $1`,
            [id]
        );
        return result.rows[0] || null;
    },

    create: async (userData: Partial<User>): Promise<User> => {
        const { fullname, firstname, lastname, email, phone_number, password, google_id, avatar_url, email_verified } = userData;

        const result = await db.query(
            `INSERT INTO users (fullname, firstname, lastname, email, phone_number, password, google_id, avatar_url, email_verified)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [fullname, firstname, lastname, email, phone_number || null, password, google_id, avatar_url, email_verified || false]
        );
        const newUser = result.rows[0];

        // If phone_number is provided, create wallet with virtual account
        if (phone_number) {
            try {
                await userService.createWalletWithVirtualAccount(
                    newUser.id, email!, firstname!, lastname!, phone_number
                );
            } catch (err) {
                console.error('Failed to create virtual account during registration:', err);
                // Still create a basic wallet without virtual account details
                await db.query(
                    'INSERT INTO wallets (user_id, balance, created_at) VALUES ($1, 0.00, NOW()) ON CONFLICT (user_id) DO NOTHING',
                    [newUser.id]
                );
            }
        } else {
            // Create basic wallet without virtual account (e.g. Google OAuth)
            await db.query(
                'INSERT INTO wallets (user_id, balance, created_at) VALUES ($1, 0.00, NOW()) ON CONFLICT (user_id) DO NOTHING',
                [newUser.id]
            );
        }

        // Return user with wallet info
        const userWithWallet = await db.query(
            `SELECT u.*, COALESCE(w.balance, 0) AS wallet_balance,
                    (w.account_number IS NOT NULL) AS has_wallet,
                    w.account_number, w.account_name, w.bank_name
             FROM users u
             LEFT JOIN wallets w ON w.user_id = u.id
             WHERE u.id = $1`,
            [newUser.id]
        );
        return userWithWallet.rows[0];
    },

    createWalletWithVirtualAccount: async (
        userId: number,
        email: string,
        firstName: string,
        lastName: string,
        phone: string
    ): Promise<void> => {
        const account = await createNewVirtualAccount(email, firstName, lastName, phone);

        await db.query(
            `INSERT INTO wallets (user_id, account_number, account_reference, account_name, bank_name, balance, created_at)
             VALUES ($1, $2, $3, $4, $5, 0.00, NOW())
             ON CONFLICT (user_id) DO UPDATE SET
                account_number = EXCLUDED.account_number,
                account_reference = EXCLUDED.account_reference,
                account_name = EXCLUDED.account_name,
                bank_name = EXCLUDED.bank_name`,
            [userId, account.account_number, account.account_reference, account.account_name, account.bank_name]
        );
    },

    updatePhoneNumber: async (id: number, phone_number: string): Promise<void> => {
        await db.query('UPDATE users SET phone_number = $1 WHERE id = $2', [phone_number, id]);
    },

    updateVerifyStatus: async (id: number, status: boolean): Promise<void> => {
        await db.query('UPDATE users SET email_verified = $1 WHERE id = $2', [status, id]);
    }
};
