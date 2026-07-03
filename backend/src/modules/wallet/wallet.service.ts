import { db } from '../../config/db.js';
import { sendEmail, emailTemplates } from '../../utils/email.js';

export interface WalletTransaction {
    id: number;
    wallet_id: number;
    amount: number;
    type: 'credit' | 'debit';
    status: 'pending' | 'success' | 'failed';
    reference: string;
    gateway_response?: any;
    description: string;
    created_at: Date;
}

export interface Wallet {
    id: number;
    user_id: number;
    account_number: string | null;
    account_reference: string | null;
    account_name: string | null;
    bank_name: string | null;
    balance: number;
    currency: string;
    status: string;
    created_at: Date;
}

export const walletService = {
    getBalance: async (userId: number): Promise<number> => {
        const result = await db.query('SELECT balance FROM wallets WHERE user_id = $1', [userId]);
        return result.rows[0]?.balance || 0;
    },

    getWalletByUserId: async (userId: number): Promise<Wallet | null> => {
        const result = await db.query('SELECT * FROM wallets WHERE user_id = $1', [userId]);
        return result.rows[0] || null;
    },

    createTransaction: async (data: { wallet_id: number; amount: number; type: string; status?: string; reference: string; description: string }): Promise<WalletTransaction> => {
        const { wallet_id, amount, type, status, reference, description } = data;

        const result = await db.query(
            `INSERT INTO wallet_transactions (wallet_id, amount, type, status, reference, description)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [wallet_id, amount, type, status || 'pending', reference, description]
        );
        return result.rows[0];
    },

    updateTransactionStatus: async (reference: string, status: 'success' | 'failed', gatewayResponse?: any): Promise<WalletTransaction | null> => {
        const client = await db.getClient();
        try {
            await client.query('BEGIN');

            // Find the transaction
            const txResult = await client.query(
                'SELECT * FROM wallet_transactions WHERE reference = $1 FOR UPDATE',
                [reference]
            );
            const transaction = txResult.rows[0];

            if (!transaction) {
                await client.query('ROLLBACK');
                return null;
            }

            if (transaction.status !== 'pending') {
                await client.query('ROLLBACK');
                return transaction; // Already processed
            }

            // Update transaction status
            const updatedTxResult = await client.query(
                `UPDATE wallet_transactions 
                 SET status = $1, gateway_response = $2 
                 WHERE id = $3 
                 RETURNING *`,
                [status, gatewayResponse, transaction.id]
            );

            // If success, update the wallet balance
            if (status === 'success') {
                const amountDelta = transaction.type === 'credit' ? transaction.amount : -transaction.amount;
                await client.query(
                    'UPDATE wallets SET balance = balance + $1 WHERE id = $2',
                    [amountDelta, transaction.wallet_id]
                );
            }

            await client.query('COMMIT');

            // if (status === 'success') {
            //     try {
            //         // Resolve user from wallets
            //         const userRes = await db.query(
            //             `SELECT u.fullname, u.email, w.balance FROM users u
            //              JOIN wallets w ON w.user_id = u.id
            //              WHERE w.id = $1`,
            //             [transaction.wallet_id]
            //         );
            //         const user = userRes.rows[0];
            //         if (user?.email) {
            //             await sendEmail(
            //                 user.email,
            //                 'Wallet Funded Successfully - TicketPay',
            //                 emailTemplates.walletFunded(user.fullname, transaction.amount, user.balance)
            //             );
            //         }
            //     } catch (emailError) {
            //         console.error('Failed to send wallet funded email:', emailError);
            //     }
            // }

            return updatedTxResult.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    creditWalletByAccountNumber: async (accountNumber: string, amount: number, gatewayPayload: any): Promise<{ wallet: Wallet; transaction: WalletTransaction } | null> => {
        const client = await db.getClient();
        try {
            await client.query('BEGIN');

            // Find wallet by account number
            const walletResult = await client.query(
                'SELECT * FROM wallets WHERE account_number = $1 FOR UPDATE',
                [accountNumber]
            );
            const wallet = walletResult.rows[0];
            if (!wallet) {
                await client.query('ROLLBACK');
                return null;
            }

            // Check for duplicate transaction using transaction_id from gateway
            const txId = gatewayPayload.transaction_id;
            const existing = await client.query(
                'SELECT * FROM wallet_transactions WHERE reference = $1',
                [txId]
            );
            if (existing.rows.length > 0) {
                await client.query('ROLLBACK');
                return { wallet, transaction: existing.rows[0] };
            }

            // Create transaction record
            const txResult = await client.query(
                `INSERT INTO wallet_transactions (wallet_id, amount, type, status, reference, gateway_response, description)
                 VALUES ($1, $2, 'credit', 'success', $3, $4, $5)
                 RETURNING *`,
                [wallet.id, amount, txId, gatewayPayload, `Wallet funding via ${gatewayPayload.sender?.bank || 'bank transfer'}`]
            );

            // Update wallet balance
            await client.query(
                'UPDATE wallets SET balance = balance + $1 WHERE id = $2',
                [amount, wallet.id]
            );

            await client.query('COMMIT');

            // Send notification email
            try {
                const userRes = await db.query(
                    `SELECT u.fullname, u.email, w.balance FROM users u
                     JOIN wallets w ON w.user_id = u.id
                     WHERE w.id = $1`,
                    [wallet.id]
                );
                const user = userRes.rows[0];
                if (user?.email) {
                    await sendEmail(
                        user.email,
                        'Wallet Funded Successfully - TicketPay',
                        emailTemplates.walletFunded(user.fullname, amount, user.balance)
                    );
                }
            } catch (emailError) {
                console.error('Failed to send wallet funded email:', emailError);
            }

            // Create in-app notification
            try {
                const userRes = await db.query('SELECT user_id FROM wallets WHERE id = $1', [wallet.id]);
                if (userRes.rows[0]) {
                    await db.query(
                        `INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)`,
                        [userRes.rows[0].user_id, 'Wallet Funded', `Your wallet has been credited with ₦${amount.toLocaleString()}.`]
                    );
                }
            } catch (notifError) {
                console.error('Failed to create funding notification:', notifError);
            }

            const updatedWallet = await db.query('SELECT * FROM wallets WHERE id = $1', [wallet.id]);
            return { wallet: updatedWallet.rows[0], transaction: txResult.rows[0] };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    getTransactionHistory: async (userId: number, limit: number = 20, offset: number = 0): Promise<WalletTransaction[]> => {
        const result = await db.query(
            `SELECT wt.* FROM wallet_transactions wt
             JOIN wallets w ON wt.wallet_id = w.id
             WHERE w.user_id = $1
             ORDER BY wt.created_at DESC
             LIMIT $2 OFFSET $3`,
            [userId, limit, offset]
        );
        return result.rows;
    }
};
