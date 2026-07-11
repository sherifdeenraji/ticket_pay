import { CorsOptions } from 'cors';
import { config } from './env.js';

const allowedOrigins = [
    config.FRONTEND.STUDENT.replace(/\/$/, ''),
    config.FRONTEND.STUDENT.replace(/\/$/, '').replace('localhost', '127.0.0.1'),
    config.FRONTEND.ADMIN.replace(/\/$/, ''),
    config.FRONTEND.ADMIN.replace(/\/$/, '').replace('localhost', '127.0.0.1'),
];

export const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.warn(`[CORS Blocked] Request from unauthorized origin: "${origin}". Allowed origins:`, allowedOrigins);
            callback(null, false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
};
