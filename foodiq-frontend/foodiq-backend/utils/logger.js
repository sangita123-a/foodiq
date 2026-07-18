/**
 * Structured logger with daily rotation.
 * Levels: error, warn, info, http, debug
 */
const fs = require('fs');
const path = require('path');
const winston = require('winston');
require('winston-daily-rotate-file');

const LOG_DIR = path.join(__dirname, '..', 'logs');
fs.mkdirSync(LOG_DIR, { recursive: true });

const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} ${level}: ${message}${extra}`;
  })
);

const appRotate = new winston.transports.DailyRotateFile({
  dirname: LOG_DIR,
  filename: 'app-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: process.env.LOG_MAX_SIZE || '20m',
  maxFiles: process.env.LOG_MAX_FILES || '14d',
  level: 'info',
});

const errorRotate = new winston.transports.DailyRotateFile({
  dirname: LOG_DIR,
  filename: 'error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: process.env.LOG_MAX_SIZE || '20m',
  maxFiles: process.env.LOG_MAX_FILES || '30d',
  level: 'error',
});

const auditRotate = new winston.transports.DailyRotateFile({
  dirname: LOG_DIR,
  filename: 'audit-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d',
  level: 'info',
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: { service: 'foodiq-api' },
  transports: [
    appRotate,
    errorRotate,
    new winston.transports.Console({
      format: consoleFormat,
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    }),
  ],
  format: jsonFormat,
});

const auditLogger = winston.createLogger({
  level: 'info',
  defaultMeta: { service: 'foodiq-audit' },
  transports: [auditRotate],
  format: jsonFormat,
});

const log = {
  info: (message, meta = {}) => logger.info(message, meta),
  warn: (message, meta = {}) => logger.warn(message, meta),
  error: (message, meta = {}) => logger.error(message, meta),
  http: (message, meta = {}) => logger.http(message, meta),
  debug: (message, meta = {}) => logger.debug(message, meta),
  audit: (message, meta = {}) => {
    auditLogger.info(message, meta);
    logger.info(message, { ...meta, channel: 'audit' });
  },
};

const listLogFiles = () => {
  try {
    return fs
      .readdirSync(LOG_DIR)
      .filter((f) => f.endsWith('.log'))
      .map((f) => {
        const full = path.join(LOG_DIR, f);
        const stat = fs.statSync(full);
        return {
          name: f,
          size: stat.size,
          modified: stat.mtime,
        };
      })
      .sort((a, b) => new Date(b.modified) - new Date(a.modified));
  } catch {
    return [];
  }
};

const readLogTail = (filename, { lines = 200, q = '' } = {}) => {
  const safe = path.basename(filename);
  const full = path.join(LOG_DIR, safe);
  if (!fs.existsSync(full)) return [];
  const content = fs.readFileSync(full, 'utf8');
  let rows = content
    .split('\n')
    .filter(Boolean)
    .slice(-Math.min(Number(lines) || 200, 2000));
  if (q) {
    const needle = String(q).toLowerCase();
    rows = rows.filter((r) => r.toLowerCase().includes(needle));
  }
  return rows.map((line) => {
    try {
      return JSON.parse(line);
    } catch {
      return { message: line };
    }
  });
};

module.exports = {
  logger,
  auditLogger,
  log,
  listLogFiles,
  readLogTail,
  LOG_DIR,
};
