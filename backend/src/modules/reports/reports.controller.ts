import { Request, Response, NextFunction } from 'express';
import { reportsService } from './reports.service.js';

export const reportsController = {
    getOverview: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const stats = await reportsService.getOverviewStats();
            res.status(200).json({ success: true, data: stats });
        } catch (error) {
            next(error);
        }
    },

    getRevenueData: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { days } = req.query;
            const data = await reportsService.getDailyRevenue(days ? parseInt(days as string) : 7);
            res.status(200).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    },

    getDriverStats: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const stats = await reportsService.getDriverPerformance();
            res.status(200).json({ success: true, data: stats });
        } catch (error) {
            next(error);
        }
    }
};
