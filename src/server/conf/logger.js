const logConfig = require('./log-conf');
const loggerSettings = logConfig.getLogSettings();
const logger = require('js-logging').dailyFile(loggerSettings);

module.exports = logger