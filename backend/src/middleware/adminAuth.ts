import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export interface AdminAuthRequest extends Request {
    admin?: any;
}

export const protectAdmin = async (req: AdminAuthRequest, res: Response, next: NextFunction) => {
    let token: string | undefined;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.admin_token) {
        token = req.cookies.admin_token;
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized as admin' });
    }

    try {
        const decoded: any = jwt.verify(token, config.JWT.ADMIN_SECRET);
        
        if (decoded.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        req.admin = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Not authorized as admin, token failed' });
    }
};
