import { db } from '../../config/db.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export interface UserWithWallet {
    id: number;
    firstname: string;
    lastname: string;
    fullname: string;
    phone_number: string | null;
    email: string;
    email_verified: boolean;
    status: 'active' | 'suspended';
    wallet_balance: number;
    created_at: Date;
}

export const userManagementService = {
    getAllUsers: async (limit: number = 20, offset: number = 0): Promise<{ users: UserWithWallet[]; total: number }> => {
        const countResult = await db.query('SELECT COUNT(*) FROM users');
        const total = parseInt(countResult.rows[0].count);

        const result = await db.query(
            `SELECT u.id, u.firstname, u.lastname, u.fullname, u.phone_number, u.email, 
                    u.email_verified, u.status, u.created_at,
                    COALESCE(w.balance, 0) AS wallet_balance,
                    (
                        SELECT COALESCE(COUNT(*), 0)
                        FROM wallet_transactions wt
                        WHERE wt.wallet_id = w.id
                    ) + (
                        SELECT COALESCE(COUNT(*), 0)
                        FROM ride_payments rp
                        WHERE rp.user_id = u.id
                    ) AS total_transactions
             FROM users u
             LEFT JOIN wallets w ON w.user_id = u.id
             ORDER BY u.id DESC
             LIMIT $1 OFFSET $2`,
            [limit, offset]
        );
        return { users: result.rows, total };
    },

    getUserById: async (id: number): Promise<UserWithWallet | null> => {
        const result = await db.query(
            `SELECT u.id, u.firstname, u.lastname, u.fullname, u.phone_number, u.email,
                    u.email_verified, u.status, u.created_at, u.google_id,
                    COALESCE(w.balance, 0) AS wallet_balance,
                    w.account_number, w.bank_name
             FROM users u
             LEFT JOIN wallets w ON w.user_id = u.id
             WHERE u.id = $1`,
            [id]
        );
        return result.rows[0] || null;
    },

    suspendUser: async (id: number): Promise<boolean> => {
        const result = await db.query(
            `UPDATE users SET status = 'suspended' WHERE id = $1 AND status = 'active' RETURNING id`,
            [id]
        );
        return result.rows.length > 0;
    },

    activateUser: async (id: number): Promise<boolean> => {
        const result = await db.query(
            `UPDATE users SET status = 'active' WHERE id = $1 AND status = 'suspended' RETURNING id`,
            [id]
        );
        return result.rows.length > 0;
    },

    adminResetPassword: async (id: number): Promise<string> => {
        // Generate a random temporary password
        const tempPassword = crypto.randomBytes(4).toString('hex'); // 8 char random password
        const hashedPassword = await bcrypt.hash(tempPassword, 12);

        await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, id]);
        return tempPassword;
    },

    getUserTransactions: async (userId: number, limit: number = 20, offset: number = 0) => {
        // Wallet transactions
        const walletTxResult = await db.query(
            `SELECT wt.id, wt.amount, wt.type, wt.status, wt.reference, wt.description, wt.created_at, 
                    'wallet' as category
             FROM wallet_transactions wt
             JOIN wallets w ON wt.wallet_id = w.id
             WHERE w.user_id = $1
             ORDER BY wt.created_at DESC
             LIMIT $2 OFFSET $3`,
            [userId, limit, offset]
        );

        // Ride payments
        const rideTxResult = await db.query(
            `SELECT rp.id, rp.amount, rp.ticket_count, rp.status, rp.transaction_id as reference,
                    d.name as driver_name, d.driver_code, rp.created_at,
                    'ride' as category
             FROM ride_payments rp
             JOIN drivers d ON rp.driver_id = d.id
             WHERE rp.user_id = $1
             ORDER BY rp.created_at DESC
             LIMIT $2 OFFSET $3`,
            [userId, limit, offset]
        );

        return {
            wallet_transactions: walletTxResult.rows,
            ride_payments: rideTxResult.rows,
        };
    },

    getWalletFundings: async (limit: number = 50, offset: number = 0) => {
        const result = await db.query(
            `SELECT wt.*, u.fullname, u.email
             FROM wallet_transactions wt
             JOIN wallets w ON wt.wallet_id = w.id
             JOIN users u ON w.user_id = u.id
             ORDER BY wt.created_at DESC
             LIMIT $1 OFFSET $2`,
            [limit, offset]
        );
        return result.rows;
    }
};
