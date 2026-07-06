import { Request, Response, NextFunction } from 'express';
import { paymentsService } from './payments.service.js';
import { AuthRequest } from '../../middleware/auth.js';

export const paymentsController = {
    payForRide: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { driver_code, ticket_count, idempotency_key } = req.body;
            const user_id = req.user.id;

            if (!driver_code || !ticket_count || !idempotency_key) {
                return res.status(400).json({ success: false, message: 'Missing required payment fields' });
            }

            const payment = await paymentsService.processRidePayment({
                user_id,
                driver_code,
                ticket_count: parseInt(ticket_count),
                idempotency_key
            });

            res.status(200).json({
                success: true,
                message: 'Ride payment successful',
                data: payment
            });
        } catch (error: any) {
            if (error.message === 'Insufficient wallet balance' || error.message === 'Driver not found or inactive') {
                return res.status(400).json({ success: false, message: error.message });
            }
            next(error);
        }
    },

    getRideHistory: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const userId = req.user.id;
            const limit = parseInt(req.query.limit as string) || 20;
            const offset = parseInt(req.query.offset as string) || 0;

            const rides = await paymentsService.getUserRideHistory(userId, limit, offset);
            res.status(200).json({
                success: true,
                data: rides,
            });
        } catch (error) {
            next(error);
        }
    },

    disputePayment: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const userId = req.user.id;
            const paymentId = parseInt(req.params.id as string);
            const { reason } = req.body;

            if (!reason) {
                return res.status(400).json({ success: false, message: 'Reason for dispute is required' });
            }

            const { db } = await import('../../config/db.js');
            const paymentRes = await db.query(
                'SELECT * FROM ride_payments WHERE id = $1 AND user_id = $2 AND status = \'completed\'',
                [paymentId, userId]
            );
            const payment = paymentRes.rows[0];

            if (!payment) {
                return res.status(404).json({ success: false, message: 'Completed ride payment not found' });
            }

            const existingDispute = await db.query('SELECT id FROM disputes WHERE ride_payment_id = $1', [paymentId]);
            if (existingDispute.rows.length > 0) {
                return res.status(400).json({ success: false, message: 'A dispute has already been filed for this payment' });
            }

            await db.query(
                `INSERT INTO disputes (ride_payment_id, user_id, driver_id, amount, reason, status)
                 VALUES ($1, $2, $3, $4, $5, 'open')`,
                [paymentId, userId, payment.driver_id, payment.amount, reason]
            );

            res.status(201).json({
                success: true,
                message: 'Dispute submitted successfully to the driver'
            });
        } catch (error) {
            next(error);
        }
    }
};
