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
    }
};
