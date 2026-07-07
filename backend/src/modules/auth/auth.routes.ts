import { Router } from 'express';
import { authController } from './auth.controller.js';
import { validate } from '../../middleware/validate.js';
import { authLimiter } from '../../middleware/rateLimiter.js';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, completeProfileSchema, verifyEmailSchema, resendVerificationSchema } from './auth.schema.js';
import { protect } from '../../middleware/auth.js';
import passport from 'passport';

const router = Router();

const { changePassword, register, login, logout, completeProfile, forgotPassword, getMe, googleCallback, resetPassword, verifyEmail, resendVerification } = authController;

// Standard Auth
router.post('/register', validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/verify-email', validate(verifyEmailSchema), verifyEmail);
router.post('/resend-verification', validate(resendVerificationSchema), resendVerification);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login' }),
    googleCallback
);

// Protected Auth Routes
router.get('/me', protect, getMe);
router.post('/logout', logout);

router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), resetPassword);
router.post('/change-password', protect, changePassword);
router.post('/complete-profile', protect, validate(completeProfileSchema), completeProfile);

export default router;
