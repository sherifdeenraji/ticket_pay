import { Router } from 'express';
import { driversController } from './drivers.controller.js';

const router = Router();

// Publicly accessible driver statistics (No login required)
router.get('/:code', driversController.getPublicDriverStats);

export default router;
