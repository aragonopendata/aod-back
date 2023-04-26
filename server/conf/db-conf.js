'use strict'

const constants = require('../util/constants');

var dbConfig = {
    user: constants.DB_USER,
    host: constants.DB_HOST,
    database: constants.DB_NAME,
    password: constants.DB_PASSWORD,
    port: constants.DB_PORT,
    max: constants.DB_MAX_CONNECTIONS,
    idleTimeoutMillis: constants.DB_IDLE_TIMEOUT_MILLIS,
    connectionTimeoutMillis: constants.DB_CONNECTION_TIMEOUT_MILLIS 
};

module.exports = {
    getDatabaseConnectionSettings: function () {
        return dbConfig;
    }
};
