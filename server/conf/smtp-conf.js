'use strict'

const constants = require('../util/constants');

var smtpConfig = {
    user: constants.SMTP_USER,
    password: constants.SMTP_PASSWORD,
    host: constants.SMTP_HOST,
    port: constants.SMTP_PORT
};

module.exports = {
    getSMTPConnectionSettings: function () {
        return smtpConfig;
    }
};