import { Request, Response, NextFunction } from 'express';
import { driverService } from './drivers.service.js';
import { driverUtils } from '../../utils/driver.utils.js';

export const driversController = {
    // Admin: Create Driver
    createDriver: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { name, phone_number, vehicle_type, vehicle_number, route, photo_url } = req.body;
            
            const driverCode = await driverUtils.generateNextCode();
            const qrCode = await driverUtils.generateQRCode(driverCode);

            const driver = await driverService.create({
                name,
                phone_number,
                driver_code: driverCode,
                qr_code: qrCode,
                vehicle_type,
                vehicle_number,
                route,
                photo_url
            });

            res.status(201).json({
                success: true,
                message: 'Driver created successfully',
                data: driver
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

            res.status(200).json({
                success: true,
                data: {
                    ...driver,
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
            const updated = await driverService.update(parseInt(id), req.body);
            
            if (!updated) {
                return res.status(404).json({ success: false, message: 'Driver not found' });
            }

            res.status(200).json({
                success: true,
                message: 'Driver updated successfully',
                data: updated
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
