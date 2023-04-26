const express = require('express');
const router = express.Router();
const https = require('https');
const constants = require('../../util/constants');
const proxy = require('../../conf/proxy-conf');
const utils = require('../../util/utils');
//LOG SETTINGS
const logConfig = require('../../conf/log-conf');
const loggerSettings = logConfig.getLogSettings();
const logger = require('js-logging').dailyFile([loggerSettings]);

/** GET ALL VIEWS */
router.get(constants.API_URL_GA_OD_CORE + constants.API_URL_GA_OD_CORE_VIEWS, function (req, res, next) {
    try {
        logger.debug('Servicio: Listado de views de GA OD CORE');
        let serviceBaseUrl = constants.GA_OD_CORE_BASE_URL;
        let serviceName = constants.GA_OD_CORE_VIEWS_LIST;
        let serviceRequestUrl = serviceBaseUrl + serviceName;
       
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

        // CAUTION!!! - https will not work at development environment - only pre & pro
        https.get(httpConf, function (results) {
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
        logger.error('Error in route' + constants.API_URL_GA_OD_CORE + constants.API_URL_GA_OD_CORE_VIEWS);
    }
});

module.exports = router;
