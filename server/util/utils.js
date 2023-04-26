const constants = require('./constants');
//LOG SETTINGS
const logConfig = require('../conf/log-conf');
const loggerSettings = logConfig.getLogSettings();
const logger = require('js-logging').dailyFile([loggerSettings]);

module.exports = {
    getRequestCommonParams: function (req) {
        var query = '';
        let sortParams = [];
        let sortOrders = [];
        let sorting = '';
        sorting = req.query.sort;

        if (sorting != null && sorting != 'null') {
            sortParams = sorting.replace(' ', '').split(',');
            for (var key in sortParams) {
                sortParams[key].charAt(0) == '-' ? sortOrders.push(constants.SERVER_API_SORT_DESC) : sortOrders.push(constants.SERVER_API_SORT_ASC);
                if (sortParams[key].charAt(0) == '-') {
                    sortParams[key] = sortParams[key].slice(1);
                }
            }

            query = '?' + constants.SERVER_API_LINK_PARAM_SORT + '=';
            if (sortParams.length > 0 && sortOrders.length > 0) {
                for (var key in sortParams) {
                    query += sortParams[key] + ' ' + sortOrders[key] + ',';
                }
            } else {
                query += constants.SERVER_API_LINK_DEFAULT_SORT;
            }
        } else {
            query = '?' + constants.SERVER_API_LINK_PARAM_SORT + '=' + constants.SERVER_API_LINK_DEFAULT_SORT;
        }
        if (req.query.rows && req.query.page) {
            query += '&' + constants.SERVER_API_LINK_PARAM_ROWS + '=' + req.query.rows + '&' + constants.SERVER_API_LINK_PARAM_START + '=' + (req.query.page * constants.DATASETS_SEARCH_ROWS_PER_PAGE);
        }

        if (req.query.type) {
            switch (req.query.type) {
                case constants.SERVER_API_LINK_PARAM_TYPE_CALENDAR:
                    query += constants.SERVER_API_LINK_PARAM_TYPE_CALENDAR_QUERY
                    break;
                case constants.SERVER_API_LINK_PARAM_TYPE_PHOTO:
                    query += constants.SERVER_API_LINK_PARAM_TYPE_PHOTO_QUERY
                    break;
                case constants.SERVER_API_LINK_PARAM_TYPE_SPREADSHEET:
                    query += constants.SERVER_API_LINK_PARAM_TYPE_SPREADSHEET_QUERY
                    break;
                case constants.SERVER_API_LINK_PARAM_TYPE_MAPS:
                    query += constants.SERVER_API_LINK_PARAM_TYPE_MAPS_QUERY
                    break;
                case constants.SERVER_API_LINK_PARAM_TYPE_EDUCATION_RESOURCES:
                    query += constants.SERVER_API_LINK_PARAM_TYPE_EDUCATION_RESOURCES_QUERY
                    break;
                case constants.SERVER_API_LINK_PARAM_TYPE_WEB_RESOURCES:
                    query += constants.SERVER_API_LINK_PARAM_TYPE_WEB_RESOURCES_QUERY
                    break;
                case constants.SERVER_API_LINK_PARAM_TYPE_RSS:
                    query += constants.SERVER_API_LINK_PARAM_TYPE_RSS_QUERY
                    break;
                case constants.SERVER_API_LINK_PARAM_TYPE_PLAIN_TEXT:
                    query += constants.SERVER_API_LINK_PARAM_TYPE_PLAIN_TEXT_QUERY
            }
        }
        return query;
    },

    getRequestTags: function (tags) {
        var query = '';
        
        tags = tags.replace(' ', '');
        tags = tags.replace('" "','" AND "');

        query = '&fq=' + constants.SERVER_API_LINK_PARAM_TAGS + ':(' + encodeURI(tags) + ')';

        return query;
    },

    getRequestOrgs: function (req) {
        var query = '';
        let orgsParams = [];
        let orgs = '';
        orgs = req.query.orgs;
        if (orgs) {
            orgsParams = orgs.replace(' ', '').split(',');
            query = '&fq=' + constants.SERVER_API_LINK_PARAM_ORGANIZATION + ':';
            if (orgsParams.length > 1) {
                query += '(';
                for (var i = 0; i < orgsParams.length; i++) {
                    if (i == (orgsParams.length-1)) {
                        query += encodeURI(orgsParams[i]);
                    } else {
                        query += encodeURI(orgsParams[i]) + ' OR ';
                    }
                }
                query += ')';
            } else {
                query += orgsParams[0];
            }
        }
        return query;
    },

    getRequestHomerCommonParams: function (req) {
        var query = '';
        let sortParams = [];
        let sortOrders = [];
        let sorting = '';

        sorting = req.query.sort;
        if (sorting) {
            sortParams = sorting.replace(' ', '').split(',');
        }
        for (var key in sortParams) {
            sortParams[key].charAt(0) == '-' ? sortOrders.push(constants.SERVER_API_SORT_DESC) : sortOrders.push(constants.SERVER_API_SORT_ASC);
            if (sortParams[key].charAt(0) == '-') {
                sortParams[key] = sortParams[key].slice(1);
            }
        }

        query = '?' + constants.SERVER_API_LINK_PARAM_SORT + '=';
        if (sortParams.length > 0 && sortOrders.length > 0) {
            for (var key in sortParams) {
                query += sortParams[key] + ' ' + sortOrders[key] + ',';
            }
        } else {
            query += constants.SERVER_API_LINK_DEFAULT_SORT_HOMER;
        }

        if (req.query.rows && req.query.page) {
            query += '&' + constants.SERVER_API_LINK_PARAM_ROWS + '=' + req.query.rows + '&' + constants.SERVER_API_LINK_PARAM_START + '=' + (req.query.page * constants.DATASETS_HOMER_SEARCH_ROWS_PER_PAGE);
        }

        if (req.query.lang != 'undefined') {
            query += '&' + constants.SERVER_API_LINK_PARAM_LANG + '=' + req.query.lang;
        }

        if (req.query.text) {
            query += '&q=' + req.query.text;
        } else {
            query += '&q=*';
        }
        query += constants.SERVER_API_LINK_PARAM_HOMER_RESPONSE_FORMAT;

        return query;
    },

    getApiKey: function (authorizationHeader) {
        if (authorizationHeader) {
            logger.info('Cabecera Authorization a comprobar: ' + authorizationHeader);
            var apiKey = authorizationHeader.split(':')[1];
            if (apiKey) {
                return apiKey;
            } else {
                return null;
            }
        } else {
            return null;
        }
    },

    verifyToken: function (authorizationHeader) {
        if (authorizationHeader) {
            var token = authorizationHeader.split(':')[0];
            if (token) {
                logger.info('Token a comprobar: ' + token);
                var cert = fs.readFileSync('server/keys/public.pem');  // get public key 
                jwt.verify(token, cert, { algorithms: ['RS256'] }, function (err, decoded) {
                    if (err) {
                        return false;
                    } else {
                        return true;
                    }
                });
            }
        } else {
            return false;
        }
    },

    errorHandler: function (err, res, serviceName) {
        logger.error('Error ' + err.code + ' in request ' + serviceName);
        var bodyerr = '';
        bodyerr = {
            status: constants.REQUEST_ERROR_INTERNAL_ERROR,
            message: 'Error: ' + err.code + ' in request ' + serviceName
        };
        res.json(bodyerr)
    }
};
