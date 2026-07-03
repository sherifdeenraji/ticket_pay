import { config } from '../config/env.js';

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

const colors = {
    reset: "\x1b[0m",
    dim: "\x1b[2m",
    info: "\x1b[36m",    // Cyan
    warn: "\x1b[33m",    // Yellow
    error: "\x1b[31m",   // Red
    debug: "\x1b[90m"    // Gray
};

const formatMessage = (level: LogLevel, message: string, meta?: any): string => {
    const timestamp = new Date().toISOString();

    if (config.NODE_ENV === 'production') {
        // Structured JSON logs for production (CloudWatch, ELK, etc.)
        return JSON.stringify({
            timestamp,
            level,
            message,
            ...(meta ? { metadata: meta } : {})
        });
    }

    // Colorized human-readable logs for development
    let color = colors.reset;
    if (level === 'INFO') color = colors.info;
    else if (level === 'WARN') color = colors.warn;
    else if (level === 'ERROR') color = colors.error;
    else if (level === 'DEBUG') color = colors.debug;

    const metaStr = meta ? ` ${colors.dim}${JSON.stringify(meta, null, 2)}${colors.reset}` : '';
    return `${colors.dim}[${timestamp}]${colors.reset} ${color}${level.padEnd(5)}${colors.reset} ${message}${metaStr}`;
};

export const logger = {
    debug: (message: string, meta?: any) => {
        if (config.NODE_ENV !== 'production' || process.env.LOG_LEVEL === 'DEBUG') {
            console.log(formatMessage('DEBUG', message, meta));
        }
    },
    info: (message: string, meta?: any) => {
        console.log(formatMessage('INFO', message, meta));
    },
    warn: (message: string, meta?: any) => {
        console.warn(formatMessage('WARN', message, meta));
    },
    error: (message: string, error?: any, meta?: any) => {
        let errMeta = {};
        if (error) {
            if (error instanceof Error) {
                errMeta = { errorName: error.name, errorMessage: error.message, stack: error.stack };
            } else {
                errMeta = { error };
            }
        }
        console.error(formatMessage('ERROR', message, { ...errMeta, ...meta }));
    }
};
