import { db } from '../../config/db.js';

export interface Admin {
    id: number;
    username: string;
    password?: string;
    created_at: Date;
}

export const adminService = {
    findByUsername: async (username: string): Promise<Admin | null> => {
        const result = await db.query('SELECT * FROM admins WHERE username = $1', [username]);
        return result.rows[0] || null;
    },

    createInitialAdmin: async (username: string, passwordHash: string): Promise<void> => {
        // Only create if no admin exists
        const count = await db.query('SELECT COUNT(*) FROM admins');
        if (parseInt(count.rows[0].count) === 0) {
            await db.query(
                'INSERT INTO admins (username, password) VALUES ($1, $2)',
                [username, passwordHash]
            );
            console.log('Initial admin created');
        }
    }
};
