'use strict'

const constants = require('../util/constants');

var dbCkanConfig = {
    user: constants.DB_CKAN_USER,
    host: constants.DB_CKAN_HOST,
    database: constants.DB_CKAN_NAME,
    password: constants.DB_CKAN_PASSWORD,
    port: constants.DB_CKAN_PORT,
    max: constants.DB_MAX_CONNECTIONS,
    idleTimeoutMillis: constants.DB_IDLE_TIMEOUT_MILLIS,
    connectionTimeoutMillis: constants.DB_CONNECTION_TIMEOUT_MILLIS 
};

module.exports = {
    getDatabaseConnectionSettings: function () {
        return dbCkanConfig;
    }
};
