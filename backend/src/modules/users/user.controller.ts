import { Request, Response, NextFunction } from 'express';
import { userManagementService } from './user.service.js';

export const userController = {
    getAllUsers: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const limit = parseInt(req.query.limit as string) || 20;
            const offset = parseInt(req.query.offset as string) || 0;

            const { users, total } = await userManagementService.getAllUsers(limit, offset);
            res.status(200).json({
                success: true,
                data: users,
                pagination: { total, limit, offset },
            });
        } catch (error) {
            next(error);
        }
    },

    getUserById: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = parseInt(req.params.id as string);
            const user = await userManagementService.getUserById(id);

            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            res.status(200).json({ success: true, data: user });
        } catch (error) {
            next(error);
        }
    },

    suspendUser: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = parseInt(req.params.id as string);
            const suspended = await userManagementService.suspendUser(id);

            if (!suspended) {
                return res.status(400).json({ success: false, message: 'User not found or already suspended' });
            }

            res.status(200).json({ success: true, message: 'User suspended successfully' });
        } catch (error) {
            next(error);
        }
    },

    activateUser: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = parseInt(req.params.id as string);
            const activated = await userManagementService.activateUser(id);

            if (!activated) {
                return res.status(400).json({ success: false, message: 'User not found or already active' });
            }

            res.status(200).json({ success: true, message: 'User activated successfully' });
        } catch (error) {
            next(error);
        }
    },

    resetPassword: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = parseInt(req.params.id as string);
            const tempPassword = await userManagementService.adminResetPassword(id);

            res.status(200).json({
                success: true,
                message: 'Password reset successfully',
                data: { temporary_password: tempPassword },
            });
        } catch (error) {
            next(error);
        }
    },

    getUserTransactions: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = parseInt(req.params.id as string);
            const limit = parseInt(req.query.limit as string) || 20;
            const offset = parseInt(req.query.offset as string) || 0;

            const transactions = await userManagementService.getUserTransactions(id, limit, offset);
            res.status(200).json({ success: true, data: transactions });
        } catch (error) {
            next(error);
        }
    },

    getWalletFundings: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const limit = parseInt(req.query.limit as string) || 50;
            const offset = parseInt(req.query.offset as string) || 0;

            const fundings = await userManagementService.getWalletFundings(limit, offset);
            res.status(200).json({ success: true, data: fundings });
        } catch (error) {
            next(error);
        }
    },
};
