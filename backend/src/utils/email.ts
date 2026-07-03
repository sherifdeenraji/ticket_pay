import nodemailer from 'nodemailer';
import { config } from '../config/env.js';

const transporter = nodemailer.createTransport({
    host: config.MAILTRAP.HOST,
    port: config.MAILTRAP.PORT,
    auth: {
        user: config.MAILTRAP.USER,
        pass: config.MAILTRAP.PASS,
    },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
    try {
        const info = await transporter.sendMail({
            from: config.MAILTRAP.FROM,
            to,
            subject,
            html,
        });
        console.log('Message sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Email delivery failed');
    }
};

// Email Templates
export const emailTemplates = {
    accountVerification: (userName: string, verificationLink: string) => `
        <h2>Welcome to TicketPay, ${userName}!</h2>
        <p>Please verify your email address to complete your registration.</p>
        <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            Verify Email
        </a>
        <p>If the button doesn't work, copy this link: ${verificationLink}</p>
    `,

    walletFunded: (userName: string, amount: number, balance: number) => `
        <h2>Wallet Funded Successfully!</h2>
        <p>Hi ${userName},</p>
        <p>Your wallet has been funded with <strong>₦${amount.toLocaleString()}</strong></p>
        <p>Your new wallet balance is: <strong>₦${balance.toLocaleString()}</strong></p>
        <p>You can now use your wallet to pay for rides on TicketPay.</p>
    `,

    paymentConfirmation: (userName: string, driverName: string, ticketCount: number, amount: number, transactionId: string) => `
        <h2>Payment Confirmation</h2>
        <p>Hi ${userName},</p>
        <p>Your payment has been processed successfully!</p>
        <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 10px; font-weight: bold;">Driver:</td>
                <td style="padding: 10px;">${driverName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 10px; font-weight: bold;">Tickets:</td>
                <td style="padding: 10px;">${ticketCount}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 10px; font-weight: bold;">Amount:</td>
                <td style="padding: 10px;">₦${amount.toLocaleString()}</td>
            </tr>
            <tr>
                <td style="padding: 10px; font-weight: bold;">Transaction ID:</td>
                <td style="padding: 10px; font-family: monospace;">${transactionId}</td>
            </tr>
        </table>
        <p>Keep this confirmation for your records.</p>
    `,

    passwordChanged: (userName: string) => `
        <h2>Password Changed</h2>
        <p>Hi ${userName},</p>
        <p>Your password has been successfully changed.</p>
        <p>If you did not request this change, please contact our support team immediately.</p>
        <p>Regards,<br>TicketPay Team</p>
    `,

    passwordReset: (userName: string, resetLink: string) => `
        <h2>Reset Your Password</h2>
        <p>Hi ${userName},</p>
        <p>We received a request to reset your TicketPay password. Click the link below to proceed:</p>
        <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            Reset Password
        </a>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request this, please ignore this email.</p>
    `,
};
