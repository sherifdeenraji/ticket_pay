import { Router } from 'express';
import { notificationsController } from './notifications.controller.js';
import { protect } from '../../middleware/auth.js';

const router = Router();

router.get('/', protect, notificationsController.getNotifications);
router.put('/:id/read', protect, notificationsController.markAsRead);
router.put('/read-all', protect, notificationsController.markAllRead);

export default router;
