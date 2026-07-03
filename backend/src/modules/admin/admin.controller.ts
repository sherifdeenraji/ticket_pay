import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { adminService } from './admin.service.js';
import { config } from '../../config/env.js';
import { AdminAuthRequest } from '../../middleware/adminAuth.js';

const signAdminToken = (id: number) => {
    return jwt.sign({ id, role: 'admin' }, config.JWT.ADMIN_SECRET as string, {
        expiresIn: config.JWT.EXPIRES_IN as any,
    });
};


export const adminController = {
    login: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { username, password } = req.body;

            const admin = await adminService.findByUsername(username);
            if (!admin || !(await bcrypt.compare(password, admin.password || ''))) {
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }

            const token = signAdminToken(admin.id);

            res.cookie('admin_token', token, {
                httpOnly: true,
                secure: config.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 24 * 60 * 60 * 1000,
            });

            res.status(200).json({
                success: true,
                message: 'Admin login successful',
                token,
            });
        } catch (error) {
            next(error);
        }
    },

    logout: (req: Request, res: Response) => {
        res.clearCookie('admin_token');
        res.status(200).json({ success: true, message: 'Admin logged out' });
    },

    getMe: async (req: AdminAuthRequest, res: Response, next: NextFunction) => {
        try {
            const adminId = req.admin?.id;
            if (!adminId) {
                return res.status(401).json({ success: false, message: 'Not authenticated' });
            }

            const { db } = await import('../../config/db.js');
            const result = await db.query('SELECT id, username, created_at FROM admins WHERE id = $1', [adminId]);
            const admin = result.rows[0];

            if (!admin) {
                return res.status(404).json({ success: false, message: 'Admin not found' });
            }

            res.status(200).json({
                success: true,
                data: admin,
            });
        } catch (error) {
            next(error);
        }
    }
};
