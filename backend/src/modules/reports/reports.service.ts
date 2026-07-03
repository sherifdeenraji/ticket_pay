import { db } from '../../config/db.js';

export const reportsService = {
    getOverviewStats: async () => {
        const result = await db.query(`
            SELECT 
                (SELECT COUNT(*) FROM users) as total_users,
                (SELECT COUNT(*) FROM drivers) as total_drivers,
                (SELECT COALESCE(SUM(amount), 0) FROM ride_payments WHERE status = 'completed') as total_revenue,
                (SELECT COUNT(*) FROM ride_payments WHERE created_at >= CURRENT_DATE) as today_rides
        `);
        return result.rows[0];
    },

    getDailyRevenue: async (days: number = 7) => {
        const result = await db.query(`
            SELECT 
                DATE(created_at) as date,
                SUM(amount) as revenue,
                COUNT(*) as rides
            FROM ride_payments
            WHERE created_at >= CURRENT_DATE - ($1 || ' days')::INTERVAL
            AND status = 'completed'
            GROUP BY DATE(created_at)
            ORDER BY DATE(created_at) ASC
        `, [days]);
        return result.rows;
    },

    getDriverPerformance: async () => {
        const result = await db.query(`
            SELECT 
                d.name,
                d.driver_code,
                COUNT(rp.id) as total_rides,
                SUM(rp.amount) as total_earned
            FROM drivers d
            LEFT JOIN ride_payments rp ON d.id = rp.driver_id
            WHERE rp.status = 'completed' OR rp.status IS NULL
            GROUP BY d.id
            ORDER BY total_earned DESC
        `);
        return result.rows;
    }
};
