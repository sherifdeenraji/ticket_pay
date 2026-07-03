import { Pool } from 'pg';
import { config } from './env.js';

const pool = new Pool({
    user: config.DB.USER,
    password: config.DB.PASSWORD,
    host: config.DB.HOST,
    port: config.DB.PORT,
    database: config.DB.NAME,
});

pool.on('connect', () => {
    console.log('PostgreSQL Pool Connected');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

export const db = {
    query: (text: string, params?: any[]) => pool.query(text, params),
    getClient: () => pool.connect(),
    pool // Exporting pool just in case
};
