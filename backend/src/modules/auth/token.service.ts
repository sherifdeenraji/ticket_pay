import { db } from '../../config/db.js';

export const tokenService = {
    createOTP: async (userId: number): Promise<string> => {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
        
        await db.query(
            `INSERT INTO password_reset_tokens (user_id, otp, expires_at)
             VALUES ($1, $2, $3)`,
            [userId, otp, expiresAt]
        );
        return otp;
    },

    verifyOTP: async (userId: number, otp: string): Promise<boolean> => {
        const result = await db.query(
            `SELECT * FROM password_reset_tokens 
             WHERE user_id = $1 AND otp = $2 AND expires_at > NOW() AND used = false
             ORDER BY created_at DESC LIMIT 1`,
            [userId, otp]
        );
        
        if (result.rows.length === 0) return false;

        // Mark as used
        await db.query('UPDATE password_reset_tokens SET used = true WHERE id = $1', [result.rows[0].id]);
        return true;
    }
};
