const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// RFC 5424 levels to match previous js-logging behavior
const levels = {
  emergency: 0,
  alert: 1,
  critical: 2,
  error: 3,
  warning: 4,
  notice: 5,
  info: 6,
  debug: 7
};

const colors = {
  emergency: 'red',
  alert: 'red',
  critical: 'red',
  error: 'red',
  warning: 'yellow',
  notice: 'cyan',
  info: 'green',
  debug: 'gray'
};

winston.addColors(colors);

// Helper to extract caller info (file, line, method)
function getCallerInfo() {
  const err = new Error();
  const stack = err.stack.split('\n');
  // Skip Error, getCallerInfo, and logger method frames
  const callerLine = stack[4] || '';
  const match = callerLine.match(/at\s+(\S+)\s+\((.+):(\d+):(\d+)\)/) ||
                callerLine.match(/at\s+(.+):(\d+):(\d+)/);
  if (match) {
    if (match.length === 5) {
      return { method: match[1], file: path.basename(match[2]), line: match[3] };
    }
    return { method: 'anonymous', file: path.basename(match[1]), line: match[2] };
  }
  return { method: 'unknown', file: 'unknown', line: '0' };
}

// Custom format matching previous: ${timestamp} <${title}> ${file}:${line} ${method} ${message}
const plainFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ssZ' }),
  winston.format((info) => {
    const caller = getCallerInfo();
    info.file = caller.file;
    info.line = caller.line;
    info.method = caller.method;
    return info;
  })(),
  winston.format.printf(({ level, message, timestamp, file, line, method, stack }) => {
    const msg = stack || message;
    return `${timestamp} <${level}> ${file}:${line} ${method} ${msg}`;
  })
);

// Console format with colors
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ssZ' }),
  winston.format((info) => {
    const caller = getCallerInfo();
    info.file = caller.file;
    info.line = caller.line;
    info.method = caller.method;
    return info;
  })(),
  winston.format.colorize(),
  winston.format.printf(({ level, message, timestamp, file, line, method, stack }) => {
    const msg = stack || message;
    return `${timestamp} <${level}> ${file}:${line} ${method} ${msg}`;
  })
);

const logger = winston.createLogger({
  levels,
  level: process.env.LOG_LEVEL || 'info',
  transports: [
    // Daily rotating plaintext file
    new DailyRotateFile({
      dirname: process.env.APP_LOG_PATH || '/app/logs',
      filename: 'aod-api_%DATE%.log',
      datePattern: 'YYYYMMDD',
      format: plainFormat
    }),
    // Console output with colors
    new winston.transports.Console({
      format: consoleFormat
    })
  ],
  // Handle uncaught exceptions
  exceptionHandlers: [
    new DailyRotateFile({
      dirname: process.env.APP_LOG_PATH || '/app/logs',
      filename: 'aod-api_exceptions_%DATE%.log',
      datePattern: 'YYYYMMDD',
      format: plainFormat
    })
  ]
});

module.exports = logger;
