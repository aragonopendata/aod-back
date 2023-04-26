const express = require('express');
const router = express.Router();
const http = require('http');
const constants = require('../../util/constants');
const proxy = require('../../conf/proxy-conf');
const utils = require('../../util/utils');
//LOG SETTINGS
const logConfig = require('../../conf/log-conf');
const loggerSettings = logConfig.getLogSettings();
const logger = require('js-logging').dailyFile([loggerSettings]);

/** GET ALL TAGS */
router.get(constants.API_URL_TAGS, function (req, res, next) {
    try {
        logger.debug('Servicio: Listado de tags');
        let serviceBaseUrl = constants.CKAN_API_BASE_URL;
        let serviceName = constants.TAGS_LIST;
        let serviceRequestUrl = serviceBaseUrl + serviceName;
        if (req.query.q) {
            serviceRequestUrl += '?q=' + encodeURIComponent(req.query.q) + '&all_fields=true';

        }else{
            serviceRequestUrl += '?all_fields=true';            
        }
        logger.notice('URL de petición: ' + serviceRequestUrl);

        //Proxy checking
        let httpConf = null;
        if (constants.REQUESTS_NEED_PROXY == true) {
            logger.warning('Realizando petición a través de proxy');
            let httpProxyConf = proxy.getproxyOptions(serviceRequestUrl);
            httpConf = httpProxyConf;
        } else {
            httpConf = serviceRequestUrl;
        }

        http.get(httpConf, function (results) {
            var body = '';
            results.on('data', function (chunk) {
                body += chunk;
            });
            results.on('end', function () {
                res.json(JSON.parse(body));
            });
        }).on('error', function (err) {
            utils.errorHandler(err, res, serviceName);
        });
    } catch (error) {
        logger.error('Error in route' + constants.API_URL_TAGS);
    }
});

module.exports = router;