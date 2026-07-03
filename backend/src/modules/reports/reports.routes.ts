import { Router } from 'express';
import { reportsController } from './reports.controller.js';
import { protectAdmin } from '../../middleware/adminAuth.js';

const router = Router();

router.get('/overview', protectAdmin, reportsController.getOverview);
router.get('/revenue', protectAdmin, reportsController.getRevenueData);
router.get('/drivers', protectAdmin, reportsController.getDriverStats);

export default router;
