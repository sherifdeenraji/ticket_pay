import { db } from '../../config/db.js';

export interface Driver {
    id: number;
    name: string;
    phone_number: string;
    driver_code: string;
    qr_code: string;
    vehicle_type: 'bus' | 'keke';
    vehicle_number: string;
    route?: string;
    photo_url?: string;
    status: 'active' | 'deactivated';
    created_at: Date;
}

export const driverService = {
    findAll: async (): Promise<any[]> => {
        const result = await db.query(`
            SELECT d.*, 
                   COALESCE((
                       SELECT SUM(rp.amount) 
                       FROM ride_payments rp 
                       WHERE rp.driver_id = d.id AND rp.created_at >= CURRENT_DATE AND rp.status = 'completed'
                   ), 0) as revenue_today
            FROM drivers d
            ORDER BY d.id DESC
        `);
        return result.rows;
    },

    findByCode: async (code: string): Promise<Driver | null> => {
        const result = await db.query('SELECT * FROM drivers WHERE driver_code = $1', [code]);
        return result.rows[0] || null;
    },

    findById: async (id: number): Promise<Driver | null> => {
        const result = await db.query('SELECT * FROM drivers WHERE id = $1', [id]);
        return result.rows[0] || null;
    },

    create: async (data: Partial<Driver>): Promise<Driver> => {
        const { name, phone_number, driver_code, qr_code, vehicle_type, vehicle_number, route, photo_url } = data;
        const result = await db.query(
            `INSERT INTO drivers (name, phone_number, driver_code, qr_code, vehicle_type, vehicle_number, route, photo_url)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [name, phone_number, driver_code, qr_code, vehicle_type, vehicle_number, route, photo_url]
        );
        return result.rows[0];
    },

    update: async (id: number, data: Partial<Driver>): Promise<Driver | null> => {
        const { name, phone_number, vehicle_type, vehicle_number, route, photo_url, status } = data;
        const result = await db.query(
            `UPDATE drivers 
             SET name = COALESCE($1, name), 
                 phone_number = COALESCE($2, phone_number), 
                 vehicle_type = COALESCE($3, vehicle_type), 
                 vehicle_number = COALESCE($4, vehicle_number), 
                 route = COALESCE($5, route), 
                 photo_url = COALESCE($6, photo_url), 
                 status = COALESCE($7, status)
             WHERE id = $8 
             RETURNING *`,
            [name, phone_number, vehicle_type, vehicle_number, route, photo_url, status, id]
        );
        return result.rows[0] || null;
    },

    getTodayPayments: async (driverId: number): Promise<any[]> => {
        const result = await db.query(
            `SELECT rp.*, u.fullname as student_name 
             FROM ride_payments rp
             JOIN users u ON rp.user_id = u.id
             WHERE rp.driver_id = $1 AND rp.created_at >= CURRENT_DATE
             ORDER BY rp.created_at DESC`,
            [driverId]
        );
        return result.rows;
    },

    getTodaySummary: async (driverId: number): Promise<{ total_tickets: number; total_amount: number }> => {
        const result = await db.query(
            `SELECT COALESCE(SUM(ticket_count), 0) as total_tickets, COALESCE(SUM(amount), 0) as total_amount
             FROM ride_payments
             WHERE driver_id = $1 AND created_at >= CURRENT_DATE AND status = 'completed'`,
            [driverId]
        );
        return {
            total_tickets: parseInt(result.rows[0].total_tickets),
            total_amount: parseFloat(result.rows[0].total_amount)
        };
    },

    updateQRCode: async (id: number, qrCode: string): Promise<void> => {
        await db.query('UPDATE drivers SET qr_code = $1 WHERE id = $2', [qrCode, id]);
    },

    updateDriverCode: async (id: number, newCode: string, newQR: string): Promise<void> => {
        await db.query(
            'UPDATE drivers SET driver_code = $1, qr_code = $2 WHERE id = $3',
            [newCode, newQR, id]
        );
    }
};
