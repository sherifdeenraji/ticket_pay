import { Router } from 'express';
import { adminController } from './admin.controller.js';
import { driversController } from '../drivers/drivers.controller.js';
import { userController } from '../users/user.controller.js';
import { protectAdmin } from '../../middleware/adminAuth.js';

const router = Router();

// Auth
router.post('/login', adminController.login);
router.post('/logout', adminController.logout);
router.get('/me', protectAdmin, adminController.getMe);

// User Management
router.get('/users', protectAdmin, userController.getAllUsers);
router.get('/users/wallet-fundings', protectAdmin, userController.getWalletFundings);
router.get('/users/:id', protectAdmin, userController.getUserById);
router.get('/users/:id/transactions', protectAdmin, userController.getUserTransactions);
router.put('/users/:id/suspend', protectAdmin, userController.suspendUser);
router.put('/users/:id/activate', protectAdmin, userController.activateUser);
router.post('/users/:id/reset-password', protectAdmin, userController.resetPassword);

// Driver Management
router.get('/drivers', protectAdmin, driversController.getAllDrivers);
router.post('/drivers', protectAdmin, driversController.createDriver);
router.get('/drivers/:id', protectAdmin, driversController.getDriverById);
router.put('/drivers/:id', protectAdmin, driversController.updateDriver);
router.post('/drivers/:id/regenerate-qr', protectAdmin, driversController.regenerateQRCode);
router.post('/drivers/:id/regenerate-code', protectAdmin, driversController.regenerateDriverCode);

// System Settings & Reports
router.get('/settings', protectAdmin, async (req, res) => {
    const { settingsService } = await import('./settings.service.js');
    const settings = await settingsService.getSettings();
    res.json({ success: true, data: settings });
});

router.put('/settings/price', protectAdmin, async (req, res) => {
    const { settingsService } = await import('./settings.service.js');
    const { price } = req.body;
    const settings = await settingsService.updatePrice(price);
    res.json({ success: true, message: 'Price updated', data: settings });
});

router.get('/reports/payments', protectAdmin, async (req, res) => {
    const { db } = await import('../../config/db.js');
    const result = await db.query('SELECT rp.*, u.firstname, u.lastname, u.fullname, d.name as driver_name FROM ride_payments rp JOIN users u ON rp.user_id = u.id JOIN drivers d ON rp.driver_id = d.id ORDER BY rp.created_at DESC LIMIT 100');
    res.json({ success: true, data: result.rows });
});

export default router;
