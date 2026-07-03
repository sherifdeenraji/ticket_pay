import { Response, NextFunction } from 'express';
import { notificationsService } from './notifications.service.js';
import { AuthRequest } from '../../middleware/auth.js';

export const notificationsController = {
    getNotifications: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const notifications = await notificationsService.getUserNotifications(req.user.id);
            res.status(200).json({
                success: true,
                data: notifications
            });
        } catch (error) {
            next(error);
        }
    },

    markAsRead: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const updated = await notificationsService.markAsRead(parseInt(id as string), req.user.id);
            
            if (!updated) {
                return res.status(404).json({ success: false, message: 'Notification not found' });
            }

            res.status(200).json({
                success: true,
                message: 'Notification marked as read'
            });
        } catch (error) {
            next(error);
        }
    },

    markAllRead: async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            await notificationsService.markAllAsRead(req.user.id);
            res.status(200).json({
                success: true,
                message: 'All notifications marked as read'
            });
        } catch (error) {
            next(error);
        }
    }
};
