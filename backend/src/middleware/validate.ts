import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export const validate = (schema: z.ZodObject<any, any>) => async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        await schema.parseAsync({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        return next();
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                message: 'Validation Error',
                errors: error.issues.map((e: any) => ({
                    path: e.path,
                    message: e.message
                })),
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error during validation',
        });
    }
};
