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
            const timestamp = req.headers['nomba-timestamp'] as string;
            console.log('Signature Header value:', signature);
            console.log('Timestamp Header value:', timestamp);
            
            if (!signature || !timestamp) {
                console.warn('Nomba Webhook received without signature or timestamp');
                return res.status(401).send('Missing signature or timestamp');
            }

            console.log('Webhook Secret configured:', config.NOMBA.WEBHOOK_SECRET);

            const payload = req.body;
            const data = payload.data || {};
            const merchant = data.merchant || {};
            const transaction = data.transaction || {};

            const eventType = payload.event_type || "";
            const requestId = payload.requestId || "";
            const userId = merchant.userId || "";
            const walletId = merchant.walletId || "";
            const transactionId = transaction.transactionId || "";
            const transactionType = transaction.type || "";
            const transactionTime = transaction.time || "";
            let transactionResponseCode = transaction.responseCode || "";

            if (transactionResponseCode === "null") {
                transactionResponseCode = "";
            }

            // Construct hashing payload according to Nomba specifications
            const hashingPayload = `${eventType}:${requestId}:${userId}:${walletId}:${transactionId}:${transactionType}:${transactionTime}:${transactionResponseCode}:${timestamp}`;
            console.log('Nomba custom hashing payload:', hashingPayload);

            // Verify HMAC-SHA256 signature
            const hmac = crypto.createHmac('sha256', config.NOMBA.WEBHOOK_SECRET as string);
            const expectedSignature = hmac.update(hashingPayload).digest('base64');
            console.log('Expected Signature calculated (Base64):', expectedSignature);

            // Use timingSafeEqual to prevent timing attacks
            const signatureBuffer = Buffer.from(signature, 'base64');
            const expectedBuffer = Buffer.from(expectedSignature, 'base64');
            console.log('Signature Buffer length:', signatureBuffer.length);
            console.log('Expected Buffer length:', expectedBuffer.length);

            const isSignatureValid = signatureBuffer.length === expectedBuffer.length && 
                                     crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
            console.log('Signature Validation Result:', isSignatureValid);

            if (!isSignatureValid) {
                console.error('Invalid Nomba webhook signature');
                return res.status(401).send('Invalid signature');
            }

            console.log('Nomba Webhook event_type:', payload.event_type);

            // Handle successful payment
            if (payload.event_type === 'payment_success' && payload.data) {
                const data = payload.data;
                const transaction = data.transaction;
                
                if (!transaction) {
                    console.error('Nomba Webhook missing transaction in data payload');
                    return res.status(400).send('Missing transaction payload');
                }

                const accountNumber = transaction.aliasAccountNumber; // The virtual account number assigned to the student
                const amount = transaction.transactionAmount; // The amount paid
                console.log('Extracted Virtual Account Number (receiver):', accountNumber);
                console.log('Extracted Amount:', amount);
                console.log('Extracted Transaction ID:', transaction.transactionId);
                console.log('Extracted Account Name:', transaction.aliasAccountName);
                console.log('Extracted Reference:', transaction.aliasAccountReference);

                if (!accountNumber) {
                    console.error('Nomba Webhook missing aliasAccountNumber in transaction data');
                    return res.status(400).send('Missing account number');
                }

                // Construct a normalized payload for our wallet service
                const walletPayload = {
                    transaction_id: transaction.transactionId,
                    amount: amount,
                    currency: 'NGN',
                    status: 'success',
                    receiver: {
                        account_number: transaction.aliasAccountNumber,
                        account_name: transaction.aliasAccountName
                    },
                    sender: {
                        bank: data.customer?.bankName || 'bank transfer'
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
                    console.error('No wallet found for virtual account number:', accountNumber);
                    return res.status(404).send('Wallet not found');
                }

                console.log(`Wallet successfully credited: ₦${amount} to account ${accountNumber}`);
            } else {
                console.log(`Ignored event_type: ${payload.event_type} (only payment_success is processed)`);
            }

            // Always respond with 200 OK to acknowledge receipt
            res.status(200).send('Webhook processed');
        } catch (error) {
            console.error('Nomba Webhook error:', error);
            res.status(500).send('Internal processing error');
        }
    }
};
