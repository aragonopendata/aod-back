const logConfig = require('./log-conf');
const loggerSettings = logConfig.getLogSettings();
const logger = require('js-logging').dailyFile([loggerSettings]);

logger.warning('This is a warning message');

module.exports = logger