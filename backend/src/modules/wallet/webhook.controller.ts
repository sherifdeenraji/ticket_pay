import { Request, Response } from 'express';
import crypto from 'crypto';
import { walletService } from './wallet.service.js';
import { config } from '../../config/env.js';

export const webhookController = {
    handleNomba: async (req: Request, res: Response) => {
        try {
            const signature = req.headers['nomba-signature'] as string;
            
            if (!signature) {
                console.warn('Nomba Webhook received without signature');
                return res.status(401).send('Missing signature');
            }

            // Verify HMAC-SHA256 signature
            const hmac = crypto.createHmac('sha256', config.NOMBA.WEBHOOK_SECRET as string);
            const rawBody = JSON.stringify(req.body);
            const expectedSignature = hmac.update(rawBody).digest('hex');

            // Use timingSafeEqual to prevent timing attacks
            const signatureBuffer = Buffer.from(signature, 'hex');
            const expectedBuffer = Buffer.from(expectedSignature, 'hex');

            if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
                console.error('Invalid Nomba webhook signature');
                return res.status(401).send('Invalid signature');
            }

            const payload = req.body;
            console.log('Valid Nomba Webhook received:', payload.event);

            // Handle successful payment
            if (payload.event === 'payment_success' && payload.data) {
                const data = payload.data;
                const accountNumber = data.accountNumber;
                const amount = data.amount;

                if (!accountNumber) {
                    console.error('Nomba Webhook missing accountNumber in data');
                    return res.status(400).send('Missing account number');
                }

                // Construct a normalized payload for our wallet service
                const walletPayload = {
                    transaction_id: data.transactionId,
                    amount: data.amount,
                    currency: data.currency,
                    status: data.status,
                    receiver: {
                        account_number: data.accountNumber,
                        account_name: data.accountName
                    },
                    sender: {
                        bank: 'bank transfer'
                    },
                    nomba_payload: payload
                };

                // Credit the wallet matched by virtual account number
                const result = await walletService.creditWalletByAccountNumber(
                    accountNumber,
                    amount,
                    walletPayload
                );

                if (!result) {
                    console.error('No wallet found for account:', accountNumber);
                    return res.status(404).send('Wallet not found');
                }

                console.log(`Wallet credited: ₦${amount} to account ${accountNumber}`);
            }

            // Always respond with 200 OK to acknowledge receipt
            res.status(200).send('Webhook processed');
        } catch (error) {
            console.error('Nomba Webhook error:', error);
            res.status(500).send('Internal processing error');
        }
    }
};
