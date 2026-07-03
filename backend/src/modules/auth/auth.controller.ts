import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userService } from './auth.service.js';
import { tokenService } from './token.service.js';
import { config } from '../../config/env.js';
import { sendEmail, emailTemplates } from '../../utils/email.js';

const signToken = (id: number) => {
    return jwt.sign({ id }, config.JWT.USER_SECRET as string, {
        expiresIn: config.JWT.EXPIRES_IN as any,
    });
};

export const authController = {
    register: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { firstname, lastname, email, password, phone_number } = req.body;

            const existingUser = await userService.findByEmail(email);
            if (existingUser) {
                return res.status(400).json({ success: false, message: 'Email already in use' });
            }
            const fullname = `${firstname} ${lastname}`;  

            const hashedPassword = await bcrypt.hash(password, 12);
            const newUser = await userService.create({
                firstname,
                lastname,
                fullname,
                email,
                phone_number,
                password: hashedPassword,
            });

            const token = signToken(newUser.id);

            // Send verification email
            try {
                const verificationLink = `${config.FRONTEND.STUDENT}/auth/verify?token=${token}`;
                await sendEmail(
                    email,
                    'Welcome to TicketPay - Verify Your Email',
                    emailTemplates.accountVerification(fullname, verificationLink)
                );
            } catch (emailError) {
                console.error('Failed to send verification email:', emailError);
                // Continue anyway, user can still login
            }

            res.status(201).json({
                success: true,
                message: 'User registered successfully. Please verify your email.',
                token,
                user: {
                    id: newUser.id,
                    fullname: newUser.fullname,
                    email: newUser.email,
                    has_wallet: newUser.has_wallet,
                },
            });
        } catch (error) {
            next(error);
        }
    },

    login: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, password } = req.body;

            const user = await userService.findByEmail(email);
            if (!user || !(await bcrypt.compare(password, user.password || ''))) {
                return res.status(401).json({ success: false, message: 'Invalid email or password' });
            }

            if (user.status === 'suspended') {
                return res.status(403).json({ success: false, message: 'Your account has been suspended' });
            }

            const token = signToken(user.id);

            // Set cookie for httpOnly JWT
            res.cookie('token', token, {
                httpOnly: true,
                secure: config.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 24 * 60 * 60 * 1000, // 1 day
            });

            res.status(200).json({
                success: true,
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    fullname: user.fullname,
                    email: user.email,
                    wallet_balance: user.wallet_balance,
                },
            });
        } catch (error) {
            next(error);
        }
    },

    forgotPassword: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email } = req.body;
            const user = await userService.findByEmail(email);

            if (!user) {
                // For security reasons, don't reveal that the user doesn't exist
                return res.status(200).json({ success: true, message: 'If an account with that email exists, an OTP has been sent.' });
            }

            const otp = await tokenService.createOTP(user.id);
            
            try {
                await sendEmail(
                    user.email,
                    'Password Reset OTP - TicketPay',
                    emailTemplates.passwordReset(user.firstname, `${config.FRONTEND.STUDENT}/auth/reset-password?email=${email}&otp=${otp}`)
                );
            } catch (emailError) {
                console.error('Failed to send password reset email:', emailError);
            }

            res.status(200).json({
                success: true,
                message: 'If an account with that email exists, an OTP has been sent.',
            });
        } catch (error) {
            next(error);
        }
    },

    resetPassword: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, otp, newPassword } = req.body;
            const user = await userService.findByEmail(email);

            if (!user) {
                return res.status(400).json({ success: false, message: 'Invalid request' });
            }

            const isValid = await tokenService.verifyOTP(user.id, otp);
            if (!isValid) {
                return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 12);
            const { db } = await import('../../config/db.js');
            await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, user.id]);

            // Send password changed confirmation email
            try {
                await sendEmail(
                    user.email,
                    'Your Password Has Been Changed - TicketPay',
                    emailTemplates.passwordChanged(user.firstname)
                );
            } catch (emailError) {
                console.error('Failed to send password changed email:', emailError);
            }

            res.status(200).json({
                success: true,
                message: 'Password reset successful. You can now login with your new password.',
            });
        } catch (error) {
            next(error);
        }
    },

    changePassword: async (req: any, res: Response, next: NextFunction) => {
        try {
            const { currentPassword, newPassword } = req.body;
            const userId = req.user.id;

            const user = await userService.findById(userId);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            const isPasswordValid = await bcrypt.compare(currentPassword, user.password || '');
            if (!isPasswordValid) {
                return res.status(401).json({ success: false, message: 'Current password is incorrect' });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 12);
            const { db } = await import('../../config/db.js');
            await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);

            // Send password changed confirmation email
            try {
                await sendEmail(
                    user.email,
                    'Your Password Has Been Changed - TicketPay',
                    emailTemplates.passwordChanged(user.firstname)
                );
            } catch (emailError) {
                console.error('Failed to send password changed email:', emailError);
            }

            res.status(200).json({
                success: true,
                message: 'Password changed successfully',
            });
        } catch (error) {
            next(error);
        }
    },

    googleCallback: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = req.user as any;
            if (!user) {
                return res.redirect(`${config.FRONTEND.STUDENT}/login?error=auth_failed`);
            }

            const token = signToken(user.id);

            // Set cookie
            res.cookie('token', token, {
                httpOnly: true,
                secure: config.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 24 * 60 * 60 * 1000,
            });

            // Check if user needs to complete profile (no virtual account)
            const fullUser = await userService.findById(user.id);
            if (fullUser && !fullUser.has_wallet) {
                res.redirect(`${config.FRONTEND.STUDENT}/auth/complete-profile?token=${token}`);
            } else {
                res.redirect(`${config.FRONTEND.STUDENT}/auth/callback?token=${token}`);
            }
        } catch (error) {
            next(error);
        }
    },

    getMe: async (req: any, res: Response) => {
        res.status(200).json({
            success: true,
            user: {
                id: req.user.id,
                fullname: req.user.fullname,
                firstname: req.user.firstname,
                lastname: req.user.lastname,
                email: req.user.email,
                phone_number: req.user.phone_number,
                wallet_balance: req.user.wallet_balance,
                has_wallet: req.user.has_wallet,
                account_number: req.user.account_number,
                account_name: req.user.account_name,
                bank_name: req.user.bank_name,
                email_verified: req.user.email_verified,
                avatar_url: req.user.avatar_url,
                created_at: req.user.created_at,
            }
        });
    },

    completeProfile: async (req: any, res: Response, next: NextFunction) => {
        try {
            const { phone_number } = req.body;
            const userId = req.user.id;

            if (!phone_number) {
                return res.status(400).json({ success: false, message: 'Phone number is required' });
            }

            // Check if user already has a complete wallet
            const user = await userService.findById(userId);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            if (user.has_wallet) {
                return res.status(400).json({ success: false, message: 'Profile already complete. Virtual account already exists.' });
            }

            // Update phone number
            await userService.updatePhoneNumber(userId, phone_number);

            // Create virtual account and update wallet
            try {
                await userService.createWalletWithVirtualAccount(
                    userId,
                    user.email,
                    user.firstname,
                    user.lastname,
                    phone_number
                );
            } catch (apiError) {
                console.error('Nomba API error during profile completion:', apiError);
                return res.status(502).json({
                    success: false,
                    message: 'Failed to create virtual account. Please try again later.',
                });
            }

            // Fetch updated user
            const updatedUser = await userService.findById(userId);

            res.status(200).json({
                success: true,
                message: 'Profile completed successfully. Virtual account created.',
                user: {
                    id: updatedUser!.id,
                    fullname: updatedUser!.fullname,
                    email: updatedUser!.email,
                    phone_number: updatedUser!.phone_number,
                    has_wallet: updatedUser!.has_wallet,
                    wallet_balance: updatedUser!.wallet_balance,
                },
            }); 
        } catch (error) {
            next(error);
        }
    },
    verifyEmail: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { token } = req.body;
            if (!token) {
                return res.status(400).json({ success: false, message: 'Verification token is required' });
            }

            // Verify JWT token
            let decoded: any;
            try {
                decoded = jwt.verify(token, config.JWT.USER_SECRET as string);
            } catch (err) {
                return res.status(400).json({ success: false, message: 'Invalid or expired verification token' });
            }

            const userId = decoded.id;
            const user = await userService.findById(userId);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            if (user.email_verified) {
                return res.status(200).json({ success: true, message: 'Email is already verified' });
            }

            await userService.updateVerifyStatus(userId, true);

            res.status(200).json({
                success: true,
                message: 'Email verified successfully',
            });
        } catch (error) {
            next(error);
        }
    },
    logout: async (req: Request, res: Response) => {
        res.clearCookie('token', {
            httpOnly: true,
            secure: config.NODE_ENV === 'production',
            sameSite: 'lax',
        });
        res.status(200).json({ success: true, message: 'Logged out successfully' });
    }
};
