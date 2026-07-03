import { db } from '../../config/db.js';
import { v4 as uuidv4 } from 'uuid';
// import { sendEmail, emailTemplates } from '../../utils/email.js';

export interface RidePayment {
    id: number;
    user_id: number;
    driver_id: number;
    amount: number;
    ticket_count: number;
    status: 'completed' | 'failed';
    transaction_id: string;
    idempotency_key: string;
    created_at: Date;
}

export const paymentsService = {
    processRidePayment: async (data: {
        user_id: number;
        driver_code: string;
        ticket_count: number;
        idempotency_key: string;
    }): Promise<RidePayment> => {
        const { user_id, driver_code, ticket_count, idempotency_key } = data;

        const client = await db.getClient();
        try {
            await client.query('BEGIN');

            // 1. Check idempotency
            const existing = await client.query(
                'SELECT * FROM ride_payments WHERE idempotency_key = $1',
                [idempotency_key]
            );
            if (existing.rows.length > 0) {
                await client.query('ROLLBACK');
                return existing.rows[0];
            }

            // 2. Get Ticket Settings (for current price)
            const settings = await client.query('SELECT current_ticket_price FROM ticket_settings LIMIT 1');
            const price = settings.rows[0]?.current_ticket_price || 200; // Default if not set
            const totalAmount = price * ticket_count;

            // 3. Get Driver
            const driverResult = await client.query('SELECT id FROM drivers WHERE driver_code = $1 AND status = \'active\'', [driver_code]);
            if (driverResult.rows.length === 0) {
                throw new Error('Driver not found or inactive');
            }
            const driverId = driverResult.rows[0].id;

            // 4. Check & Deduct Student Balance (using wallets table)
            const userWalletResult = await client.query(
                'SELECT w.id, w.balance FROM wallets w WHERE w.user_id = $1 FOR UPDATE',
                [user_id]
            );
            if (userWalletResult.rows.length === 0) {
                throw new Error('User wallet not found');
            }
            const wallet = userWalletResult.rows[0];
            const balance = parseFloat(wallet.balance);

            if (balance < totalAmount) {
                throw new Error('Insufficient wallet balance');
            }

            await client.query('UPDATE wallets SET balance = balance - $1 WHERE id = $2', [totalAmount, wallet.id]);

            // 5. Create Ride Payment
            const transactionId = `TXN-${uuidv4().substring(0, 8).toUpperCase()}`;
            const paymentResult = await client.query(
                `INSERT INTO ride_payments (user_id, driver_id, amount, ticket_count, ticket_price, status, transaction_id, idempotency_key)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 RETURNING *`,
                [user_id, driverId, totalAmount, ticket_count, price, 'completed', transactionId, idempotency_key]
            );

            // 6. Log notification (internal) - Optional: add notification logic here
            await client.query(
                `INSERT INTO notifications (user_id, title, message)
                 VALUES ($1, $2, $3)`,
                [user_id, 'Payment Successful', `You paid ₦${totalAmount} for ${ticket_count} ticket(s) to ${driver_code}.`]
            );

            // 7. Log wallet debit transaction
            const walletTxRef = `RIDE-${transactionId}`;
            await client.query(
                `INSERT INTO wallet_transactions (wallet_id, amount, type, status, reference, description)
                 VALUES ($1, $2, 'debit', 'success', $3, $4)`,
                [wallet.id, totalAmount, walletTxRef, `Ride payment: ${ticket_count} ticket(s) to ${driver_code}`]
            );

            await client.query('COMMIT');
            // disabled sending email for now to avoid issues with mailtrap limits during testing

            // try {
            //     const userResult = await db.query('SELECT fullname, email FROM users WHERE id = $1', [user_id]);
            //     const driverResult = await db.query('SELECT name FROM drivers WHERE id = $1', [driverId]);
            //     const user = userResult.rows[0];
            //     const driver = driverResult.rows[0];

            //     if (user?.email) {
            //         await sendEmail(
            //             user.email,
            //             'Ride Payment Successful - TicketPay',
            //             emailTemplates.paymentConfirmation(
            //                 user.fullname,
            //                 driver?.name || driver_code,
            //                 ticket_count,
            //                 totalAmount,
            //                 transactionId
            //             )
            //         );
            //     }
            // } catch (emailError) {
            //     console.error('Failed to send ride payment email:', emailError);
            // }

            return paymentResult.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    getUserRideHistory: async (userId: number, limit: number = 20, offset: number = 0) => {
        const result = await db.query(
            `SELECT rp.*, d.name as driver_name, d.driver_code
             FROM ride_payments rp
             JOIN drivers d ON rp.driver_id = d.id
             WHERE rp.user_id = $1
             ORDER BY rp.created_at DESC
             LIMIT $2 OFFSET $3`,
            [userId, limit, offset]
        );
        return result.rows;
    }
};
