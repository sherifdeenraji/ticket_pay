import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { userService } from '../modules/auth/auth.service.js';

export interface AuthRequest extends Request {
    user?: any;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
    let token: string | undefined;

    // if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    //     token = req.headers.authorization.split(' ')[1];
    // } else 
        
    if (req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }

    try {
        const decoded: any = jwt.verify(token, config.JWT.USER_SECRET);
        const user = await userService.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ success: false, message: 'User no longer exists' });
        }

        if (user.status === 'suspended') {
            return res.status(403).json({ success: false, message: 'Your account is suspended' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
};
