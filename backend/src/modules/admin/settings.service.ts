import { db } from '../../config/db.js';

export const settingsService = {
    getSettings: async () => {
        const result = await db.query('SELECT * FROM ticket_settings LIMIT 1');
        if (result.rows.length === 0) {
            // Seed default
            const initial = await db.query(
                'INSERT INTO ticket_settings (current_ticket_price) VALUES ($1) RETURNING *',
                [100]
            );
            return initial.rows[0];
        }
        return result.rows[0];
    },

    updatePrice: async (newPrice: number) => {
        const result = await db.query(
            'UPDATE ticket_settings SET current_ticket_price = $1, last_updated = NOW() RETURNING *',
            [newPrice]
        );
        return result.rows[0];
    }
};
