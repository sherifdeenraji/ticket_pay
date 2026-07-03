import { Router } from 'express';
import { walletController } from './wallet.controller.js';
import { webhookController } from './webhook.controller.js';
import { protect } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { z } from 'zod';

const router = Router();

// Zod schema for funding request
const fundSchema = z.object({
    body: z.object({
        amount: z.number().positive('Amount must be greater than 0'),
    })
});

// Private User Routes
router.get('/balance', protect, walletController.getBalance);
router.get('/details', protect, walletController.getWalletDetails);
router.post('/fund', protect, validate(fundSchema), walletController.fundWallet);
router.get('/transactions', protect, walletController.getTransactionHistory);

// IMPORTANT: Nomba hits this directly
router.post('/webhook/nomba', webhookController.handleNomba);

export default router;
