const constants = require('../util/constants');

function corsPermission() {
    this.permission = function(req, res, next) {
        res.header(constants.CORS_HEADERS_ALLOW_ORIGIN_HEADER, constants.CORS_HEADERS_ALLOW_ORIGIN_VALUE);
        res.header(constants.CORS_HEADERS_ALLOW_HEADERS_HEADER, constants.CORS_HEADERS_ALLOW_HEADERS_VALUE);
        res.header(constants.CORS_HEADERS_ALLOW_METHODS_HEADER, constants.CORS_HEADERS_ALLOW_METHODS_VALUE);
        next();
    }
}

module.exports = new corsPermission();