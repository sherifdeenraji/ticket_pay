import { z } from 'zod';

export const userIdParamSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, 'User ID must be a number'),
    }),
});
