import { Request, Response, NextFunction } from 'express';
import { walletService } from './wallet.service.js';
import { config } from '../../config/env.js';
import { AuthRequest } from '../../middleware/auth.js';

export const walletController = {
    getBalance: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const balance = await walletService.getBalance(req.user.id);
            res.status(200).json({
                success: true,
                balance,
            });
        } catch (error) {
            next(error);
        }
    },

    fundWallet: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { amount } = req.body;
            const userId = req.user.id;

            if (!amount || amount <= 0) {
                return res.status(400).json({ success: false, message: 'Invalid amount' });
            }

            // Look up the user's existing static virtual account
            const wallet = await walletService.getWalletByUserId(userId);

            if (!wallet || !wallet.account_number) {
                return res.status(400).json({
                    success: false,
                    message: 'No virtual account found. Please complete your profile first.',
                });
            }

            // Return the static virtual account details for the user to transfer to
            res.status(200).json({
                success: true,
                message: 'Please transfer the exact amount to the virtual account below. Your wallet will be credited automatically.',
                data: {
                    account_number: wallet.account_number,
                    bank_name: wallet.bank_name,
                    account_name: wallet.account_name,
                    amount: amount,
                },
            });
        } catch (error) {
            next(error);
        }
    },

    getWalletDetails: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const wallet = await walletService.getWalletByUserId(req.user.id);

            if (!wallet) {
                return res.status(404).json({ success: false, message: 'Wallet not found' });
            }

            res.status(200).json({
                success: true,
                data: {
                    balance: wallet.balance,
                    account_number: wallet.account_number,
                    account_name: wallet.account_name,
                    bank_name: wallet.bank_name,
                    currency: wallet.currency,
                    has_virtual_account: !!wallet.account_number,
                },
            });
        } catch (error) {
            next(error);
        }
    },

    getTransactionHistory: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const userId = req.user.id;
            const { limit, offset } = req.query;
            
            const transactions = await walletService.getTransactionHistory(
                userId, 
                parseInt(limit as string) || 20, 
                parseInt(offset as string) || 0
            );

            res.status(200).json({
                success: true,
                data: transactions,
            });
        } catch (error) {
            next(error);
        }
    }
};
