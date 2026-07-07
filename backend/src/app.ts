import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import { config } from './config/env.js';
import { corsOptions } from './config/cors.js';
import { errorHandler } from './middleware/errorHandler.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { requestLogger } from './middleware/requestLogger.js';

import authRoutes from './modules/auth/auth.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import walletRoutes from './modules/wallet/wallet.routes.js';
import { webhookController } from './modules/wallet/webhook.controller.js';
import driversRoutes from './modules/drivers/drivers.routes.js';
import paymentsRoutes from './modules/payments/payments.routes.js';
import passport from './config/passport.js';

import notificationsRoutes from './modules/notifications/notifications.routes.js';
import reportsRoutes from './modules/reports/reports.routes.js';
import userRoutes from './modules/users/user.routes.js';

const app: Express = express();
const isMain = process.argv[1] === fileURLToPath(import.meta.url);

// Request Logging
app.use(requestLogger);

// Security Middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// Trust proxy (required since we are behind Nginx proxy to identify real client IPs for rate limiting)
app.set('trust proxy', 1);

// Rate Limiting
app.use(generalLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/wallet', walletRoutes);
app.post('/api/wallets/webhook/nomba', webhookController.handleNomba); // Specific alias for Nomba webhook
app.use('/api/drivers', driversRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/users', userRoutes);

// Status route
app.get('/status', (req: Request, res: Response) => {
    res.json({
        success: true,
        message: 'OAU TicketPay Backend is running',
        environment: config.NODE_ENV,
        timestamp: new Date().toISOString()
    });
});

// CSRF Protection (will be fully integrated with routes later)
// For now, let's export app for testing
app.use(errorHandler);

const PORT = config.PORT;

if (isMain) {
    app.listen(PORT, () => {
        console.log(`Server running in ${config.NODE_ENV} mode on port ${PORT}`);
    });
}

export default app;
