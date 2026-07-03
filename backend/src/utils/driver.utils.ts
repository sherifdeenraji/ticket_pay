import QRCode from 'qrcode';
import { db } from '../config/db.js';

export const driverUtils = {
    /**
     * Generates next sequential driver code like DRV001, DRV002...
     */
    generateNextCode: async (): Promise<string> => {
        const result = await db.query('SELECT driver_code FROM drivers ORDER BY id DESC LIMIT 1');
        
        if (result.rows.length === 0) {
            return 'DRV001';
        }

        const lastCode = result.rows[0].driver_code; // e.g. DRV001
        const lastNumber = parseInt(lastCode.replace('DRV', ''));
        const nextNumber = lastNumber + 1;
        
        return `DRV${nextNumber.toString().padStart(3, '0')}`;
    },

    /**
     * Generates a base64 QR code PNG for a driver code
     */
    generateQRCode: async (driverCode: string): Promise<string> => {
        try {
            // Using a static QR that just contains the code as requested
            // Scanners will parse this and redirect to payment flow
            const qrDataURL = await QRCode.toDataURL(driverCode);
            return qrDataURL;
        } catch (err) {
            console.error('QR Generation failed:', err);
            throw new Error('Failed to generate QR code');
        }
    }
};
