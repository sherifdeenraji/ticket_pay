import { db } from '../../config/db.js';

export interface Notification {
    id: number;
    user_id: number;
    title: string;
    message: string;
    read: boolean;
    created_at: Date;
}

export const notificationsService = {
    getUserNotifications: async (userId: number): Promise<Notification[]> => {
        const result = await db.query(
            'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
            [userId]
        );
        return result.rows;
    },

    markAsRead: async (id: number, userId: number): Promise<boolean> => {
        const result = await db.query(
            'UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2 RETURNING id',
            [id, userId]
        );
        return result.rows.length > 0;
    },

    markAllAsRead: async (userId: number): Promise<void> => {
        await db.query(
            'UPDATE notifications SET read = true WHERE user_id = $1',
            [userId]
        );
    },

    createNotification: async (userId: number, title: string, message: string): Promise<Notification> => {
        const result = await db.query(
            'INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3) RETURNING *',
            [userId, title, message]
        );
        return result.rows[0];
    }
};
