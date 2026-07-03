import { Router } from 'express';
import { driversController } from './drivers.controller.js';
import { protectDriver } from '../../middleware/driverAuth.js';

const router = Router();

// Auth Routes
router.post('/login', driversController.login);
router.post('/logout', driversController.logout);

// Protected Driver Dashboard & Stats Routes
router.get('/me/dashboard', protectDriver, driversController.getDashboardStats);
router.get('/me/disputes', protectDriver, driversController.getDriverDisputes);
router.post('/me/disputes/:id/resolve', protectDriver, driversController.resolveDispute);

// Publicly accessible driver statistics (No login required)
router.get('/:code', driversController.getPublicDriverStats);

export default router;
