import { Request, Response } from 'express';
import crypto from 'crypto';
import { walletService } from './wallet.service.js';
import { config } from '../../config/env.js';

export const webhookController = {
    handleNomba: async (req: Request, res: Response) => {
        try {
            console.log('--- Nomba Webhook Received ---');
            console.log('Headers:', JSON.stringify(req.headers, null, 2));
            console.log('Request Body:', JSON.stringify(req.body, null, 2));

            const signature = req.headers['nomba-signature'] as string;
            console.log('Signature Header value:', signature);
            
            if (!signature) {
                console.warn('Nomba Webhook received without signature');
                return res.status(401).send('Missing signature');
            }

            console.log('Webhook Secret configured:', config.NOMBA.WEBHOOK_SECRET);

            // Verify HMAC-SHA256 signature
            const hmac = crypto.createHmac('sha256', config.NOMBA.WEBHOOK_SECRET as string);
            const rawBody = JSON.stringify(req.body);
            console.log('Raw stringified body used for hashing:', rawBody);

            const expectedSignature = hmac.update(rawBody).digest('hex');
            console.log('Expected Signature calculated:', expectedSignature);

            // Use timingSafeEqual to prevent timing attacks
            const signatureBuffer = Buffer.from(signature, 'hex');
            const expectedBuffer = Buffer.from(expectedSignature, 'hex');
            console.log('Signature Buffer length:', signatureBuffer.length);
            console.log('Expected Buffer length:', expectedBuffer.length);

            const isSignatureValid = signatureBuffer.length === expectedBuffer.length && 
                                     crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
            console.log('Signature Validation Result:', isSignatureValid);

            if (!isSignatureValid) {
                console.error('Invalid Nomba webhook signature');
                return res.status(401).send('Invalid signature');
            }

            const payload = req.body;
            console.log('Nomba Webhook event type:', payload.event);

            // Handle successful payment
            if (payload.event === 'payment_success' && payload.data) {
                const data = payload.data;
                const accountNumber = data.accountNumber;
                const amount = data.amount;
                console.log('Extracted Account Number:', accountNumber);
                console.log('Extracted Amount:', amount);
                console.log('Extracted Transaction ID:', data.transactionId);
                console.log('Extracted Currency:', data.currency);
                console.log('Extracted Status:', data.status);
                console.log('Extracted Account Name:', data.accountName);

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
                console.log('Prepared Wallet Payload:', JSON.stringify(walletPayload, null, 2));

                // Credit the wallet matched by virtual account number
                console.log(`Attempting to credit wallet. Account Number: ${accountNumber}, Amount: ${amount}`);
                const result = await walletService.creditWalletByAccountNumber(
                    accountNumber,
                    amount,
                    walletPayload
                );
                console.log('Wallet Credit Service invocation result:', result);

                if (!result) {
                    console.error('No wallet found for account:', accountNumber);
                    return res.status(404).send('Wallet not found');
                }

                console.log(`Wallet successfully credited: ₦${amount} to account ${accountNumber}`);
            } else {
                console.log(`Ignored event type: ${payload.event} (only payment_success is processed)`);
            }

            // Always respond with 200 OK to acknowledge receipt
            res.status(200).send('Webhook processed');
        } catch (error) {
            console.error('Nomba Webhook error:', error);
            res.status(500).send('Internal processing error');
        }
    }
};
