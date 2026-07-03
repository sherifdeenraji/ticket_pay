import { Router } from 'express';
import { userController } from './user.controller.js';
import { protectAdmin } from '../../middleware/adminAuth.js';

const router = Router();

// All routes require admin authentication
router.get('/', protectAdmin, userController.getAllUsers);
router.get('/wallet-fundings', protectAdmin, userController.getWalletFundings);
router.get('/:id', protectAdmin, userController.getUserById);
router.get('/:id/transactions', protectAdmin, userController.getUserTransactions);
router.put('/:id/suspend', protectAdmin, userController.suspendUser);
router.put('/:id/activate', protectAdmin, userController.activateUser);
router.post('/:id/reset-password', protectAdmin, userController.resetPassword);

export default router;
