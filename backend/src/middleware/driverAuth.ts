import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { driverService } from '../modules/drivers/drivers.service.js';

export interface DriverAuthRequest extends Request {
    driver?: any;
}

export const protectDriver = async (req: DriverAuthRequest, res: Response, next: NextFunction) => {
    let token: string | undefined;

    if (req.cookies.driver_token) {
        token = req.cookies.driver_token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized, no driver token' });
    }

    try {
        const decoded: any = jwt.verify(token, config.JWT.USER_SECRET);
        
        // Ensure this token belongs to a driver
        if (decoded.role !== 'driver') {
            return res.status(403).json({ success: false, message: 'Forbidden, not a driver token' });
        }

        const driver = await driverService.findById(decoded.id);

        if (!driver) {
            return res.status(401).json({ success: false, message: 'Driver no longer exists' });
        }

        if (driver.status === 'deactivated' || driver.status === 'inactive') {
            return res.status(403).json({ success: false, message: 'Driver account is inactive' });
        }

        req.driver = driver;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
};
