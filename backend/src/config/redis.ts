import { Redis } from 'ioredis';
import { config } from './env.js';

const redis = new Redis({
  host: config.REDIS.HOST,
  port: config.REDIS.PORT,
  maxRetriesPerRequest: null,
});

redis.on('connect', () => {
  console.log(`Redis connected to ${config.REDIS.HOST}:${config.REDIS.PORT}`);
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

export default redis;
