import bcrypt from 'bcryptjs';
import { adminService } from '../modules/admin/admin.service.js';
import { config } from '../config/env.js';

async function seedAdmin() {
    console.log('Seeding initial admin user...');
    try {
        const username = config.ADMIN.USERNAME;
        const plainPassword = config.ADMIN.PASSWORD;

        if (!username || !plainPassword) {
            console.error('ADMIN_USERNAME or ADMIN_PASSWORD not configured in environment.');
            process.exit(1);
        }

        const passwordHash = await bcrypt.hash(plainPassword, 12);
        await adminService.createInitialAdmin(username, passwordHash);
        console.log('Seed completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
}

seedAdmin();
