import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { driverService } from './drivers.service.js';
import { driverUtils } from '../../utils/driver.utils.js';
import { config } from '../../config/env.js';
import { DriverAuthRequest } from '../../middleware/driverAuth.js';

const signDriverToken = (id: number) => {
    return jwt.sign({ id, role: 'driver' }, config.JWT.USER_SECRET as string, {
        expiresIn: config.JWT.EXPIRES_IN as any,
    });
};

export const driversController = {
    // Driver: Authentication login
    login: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { identifier, password } = req.body; // driver_code or phone_number

            if (!identifier || !password) {
                return res.status(400).json({ success: false, message: 'Identifier and password are required' });
            }

            const driver = await driverService.findByCodeOrPhone(identifier);
            if (!driver || !(await bcrypt.compare(password, driver.password || ''))) {
                return res.status(401).json({ success: false, message: 'Invalid identifier or password' });
            }

            if (driver.status === 'deactivated' || driver.status === 'inactive') {
                return res.status(403).json({ success: false, message: 'Driver account is inactive' });
            }

            const token = signDriverToken(driver.id);

            // Set cookie for driver_token
            res.cookie('driver_token', token, {
                httpOnly: true,
                secure: config.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 24 * 60 * 60 * 1000, // 1 day
            });

            res.status(200).json({
                success: true,
                message: 'Driver login successful',
                token,
                driver: {
                    id: driver.id,
                    name: driver.name,
                    driver_code: driver.driver_code,
                    phone_number: driver.phone_number,
                    vehicle_type: driver.vehicle_type,
                    vehicle_number: driver.vehicle_number,
                    route: driver.route
                }
            });
        } catch (error) {
            next(error);
        }
    },

    // Driver: Authentication logout
    logout: (req: Request, res: Response) => {
        res.clearCookie('driver_token');
        res.status(200).json({ success: true, message: 'Driver logged out' });
    },

    // Driver: Dashboard Stats & Transaction History
    getDashboardStats: async (req: DriverAuthRequest, res: Response, next: NextFunction) => {
        try {
            const driverId = req.driver.id;

            const payments = await driverService.getTodayPayments(driverId);
            const summary = await driverService.getTodaySummary(driverId);

            res.status(200).json({
                success: true,
                data: {
                    driver: {
                        name: req.driver.name,
                        code: req.driver.driver_code,
                        phone_number: req.driver.phone_number,
                        vehicle_type: req.driver.vehicle_type,
                        vehicle_number: req.driver.vehicle_number,
                        route: req.driver.route
                    },
                    today_payments: payments,
                    summary: {
                        ...summary,
                        last_updated: new Date().toISOString()
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    },

    // Driver: Get Disputes
    getDriverDisputes: async (req: DriverAuthRequest, res: Response, next: NextFunction) => {
        try {
            const driverId = req.driver.id;
            const disputes = await driverService.getDisputes(driverId);

            res.status(200).json({
                success: true,
                data: disputes
            });
        } catch (error) {
            next(error);
        }
    },

    // Driver: Resolve Dispute (Approve/Reject)
    resolveDispute: async (req: DriverAuthRequest, res: Response, next: NextFunction) => {
        try {
            const driverId = req.driver.id;
            const disputeId = parseInt(req.params.id as string);
            const { action } = req.body; // 'approved' or 'rejected'

            if (action !== 'approved' && action !== 'rejected') {
                return res.status(400).json({ success: false, message: 'Action must be approved or rejected' });
            }

            const dispute = await driverService.findDisputeById(disputeId);
            if (!dispute) {
                return res.status(404).json({ success: false, message: 'Dispute not found' });
            }

            if (dispute.driver_id !== driverId) {
                return res.status(403).json({ success: false, message: 'Not authorized to resolve this dispute' });
            }

            const success = await driverService.resolveDispute(disputeId, action);
            if (!success) {
                return res.status(400).json({ success: false, message: 'Dispute is not open or already resolved' });
            }

            res.status(200).json({
                success: true,
                message: `Dispute has been ${action} successfully`
            });
        } catch (error) {
            next(error);
        }
    },

    // Admin: Create Driver
    createDriver: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { name, phone_number, password, vehicle_type, vehicle_number, route, photo_url } = req.body;
            
            const driverCode = await driverUtils.generateNextCode();
            const qrCode = await driverUtils.generateQRCode(driverCode);

            const tempPassword = password || `Ticket-${driverCode}`;
            const hashedPassword = await bcrypt.hash(tempPassword, 12);

            const driver = await driverService.create({
                name,
                phone_number,
                password: hashedPassword,
                driver_code: driverCode,
                qr_code: qrCode,
                vehicle_type,
                vehicle_number,
                route,
                photo_url
            });

            // Strip password from response
            const { password: _, ...driverWithoutPassword } = driver as any;

            res.status(201).json({
                success: true,
                message: 'Driver created successfully',
                data: {
                    ...driverWithoutPassword,
                    temporary_password: password ? undefined : tempPassword
                }
            });
        } catch (error) {
            next(error);
        }
    },

    // Admin: List all drivers
    getAllDrivers: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const drivers = await driverService.findAll();
            res.status(200).json({
                success: true,
                data: drivers
            });
        } catch (error) {
            next(error);
        }
    },

    // Admin: Get single driver by ID
    getDriverById: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = parseInt(req.params.id as string);
            const driver = await driverService.findById(id);

            if (!driver) {
                return res.status(404).json({ success: false, message: 'Driver not found' });
            }

            const todayPayments = await driverService.getTodayPayments(driver.id);
            const summary = await driverService.getTodaySummary(driver.id);

            // Strip password from response
            const { password: _, ...driverWithoutPassword } = driver as any;

            res.status(200).json({
                success: true,
                data: {
                    ...driverWithoutPassword,
                    today_payments: todayPayments,
                    today_summary: summary,
                }
            });
        } catch (error) {
            next(error);
        }
    },

    // Public: Get Driver Stats (for students to show drivers)
    getPublicDriverStats: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const code = req.params.code as string;
            const driver = await driverService.findByCode(code);

            if (!driver) {
                return res.status(404).json({ success: false, message: 'Driver not found' });
            }

            const payments = await driverService.getTodayPayments(driver.id);
            const summary = await driverService.getTodaySummary(driver.id);

            res.status(200).json({
                success: true,
                data: {
                    driver: {
                        name: driver.name,
                        code: driver.driver_code,
                        vehicle_number: driver.vehicle_number,
                        vehicle_type: driver.vehicle_type
                    },
                    today_payments: payments,
                    summary: {
                        ...summary,
                        last_updated: new Date().toISOString()
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    },

    // Admin: Update Driver
    updateDriver: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = req.params.id as string;
            const { password, ...otherData } = req.body;

            let updatePayload = { ...otherData };
            if (password) {
                updatePayload.password = await bcrypt.hash(password, 12);
            }

            const updated = await driverService.update(parseInt(id), updatePayload);
            
            if (!updated) {
                return res.status(404).json({ success: false, message: 'Driver not found' });
            }

            // Strip password
            const { password: _, ...updatedWithoutPassword } = updated as any;

            res.status(200).json({
                success: true,
                message: 'Driver updated successfully',
                data: updatedWithoutPassword
            });
        } catch (error) {
            next(error);
        }
    },

    // Admin: Regenerate QR Code for a driver
    regenerateQRCode: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = parseInt(req.params.id as string);
            const driver = await driverService.findById(id);

            if (!driver) {
                return res.status(404).json({ success: false, message: 'Driver not found' });
            }

            const newQR = await driverUtils.generateQRCode(driver.driver_code);
            await driverService.updateQRCode(id, newQR);

            res.status(200).json({
                success: true,
                message: 'QR code regenerated successfully',
                data: { qr_code: newQR }
            });
        } catch (error) {
            next(error);
        }
    },

    // Admin: Regenerate Driver Code
    regenerateDriverCode: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = parseInt(req.params.id as string);
            const driver = await driverService.findById(id);

            if (!driver) {
                return res.status(404).json({ success: false, message: 'Driver not found' });
            }

            const newCode = await driverUtils.generateNextCode();
            const newQR = await driverUtils.generateQRCode(newCode);
            await driverService.updateDriverCode(id, newCode, newQR);

            res.status(200).json({
                success: true,
                message: 'Driver code and QR regenerated successfully',
                data: { driver_code: newCode, qr_code: newQR }
            });
        } catch (error) {
            next(error);
        }
    }
};
