import { z } from 'zod';

export const registerSchema = z.object({
    body: z.object({
        firstname: z.string().min(3, 'First name must be at least 3 characters'),
        lastname: z.string().min(3, 'Last name must be at least 3 characters'),
        email: z.string().email('Invalid email address'),
        password: z.string().min(6, 'Password must be at least 6 characters'),
        phone_number: z.string().min(10, 'Phone number must be at least 10 digits').optional(),
    }),
});

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email address'),
        password: z.string().min(1, 'Password is required'),
    }),
});

export const forgotPasswordSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email address'),
    }),
});

export const resetPasswordSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email address'),
        otp: z.string().length(6, 'OTP must be 6 digits'),
        newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    }),
});

export const completeProfileSchema = z.object({
    body: z.object({
        phone_number: z.string().min(10, 'Phone number must be at least 10 digits'),
    }),
});

export const verifyEmailSchema = z.object({
    body: z.object({
        token: z.string().min(1, 'Verification token is required'),
    }),
});
