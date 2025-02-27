import winston from 'winston';
import { env } from '../config/env';

// Custom JSON replacer to handle BigInt serialization
const bigIntReplacer = (key: string, value: any) => {
  // Convert BigInt values to strings with a suffix indicating they're BigInts
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
};

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Create a custom formatter for console output that outputs entire message on one line
const oneLineFormat = winston.format.printf(({ level, message, timestamp, ...meta }) => {
  let metaStr = '';
  if (Object.keys(meta).length && meta.service) {
    const { service, ...otherMeta } = meta;
    if (Object.keys(otherMeta).length) {
      try {
        metaStr = ` ${JSON.stringify(otherMeta, bigIntReplacer)}`;
      } catch (e) {
        metaStr = ' [Meta serialization failed]';
      }
    }
  }
  return `${timestamp} ${level}: ${message}${metaStr}`;
});

// Create logger instance
const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { service: 'dm-ip' },
  transports: [
    // Write logs to console with one-line format
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        oneLineFormat
      )
    }),
  ],
});

export default logger;