import { Router } from 'express';
import { paymentsController } from './payments.controller.js';
import { protect } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { z } from 'zod';

const router = Router();

// Zod schema for ride payment
const ridePaymentSchema = z.object({
    body: z.object({
        driver_code: z.string().min(1, 'Driver code is required'),
        ticket_count: z.number().int().positive('Ticket count must be a positive integer'),
        idempotency_key: z.string().min(1, 'Idempotency key is required'),
    })
});

router.post('/pay', protect, validate(ridePaymentSchema), paymentsController.payForRide);
router.get('/history', protect, paymentsController.getRideHistory);
router.post('/:id/dispute', protect, paymentsController.disputePayment);

export default router;
