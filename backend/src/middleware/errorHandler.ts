import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export interface AppError extends Error {
    statusCode?: number;
    errors?: any;
}

export const errorHandler = (
    err: AppError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const statusCode = err.statusCode || 500;
    const message = statusCode === 500 ? 'Internal Server Error' : err.message;

    // Log full error details using logger utility
    logger.error(`${statusCode} - ${err.message}`, err, { errors: err.errors });

    res.status(statusCode).json({
        success: false,
        message,
    });
};
