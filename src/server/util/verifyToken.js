var jwt = require('jsonwebtoken');
var fs = require('fs');
const constants = require('./constants');
//LOG SETTINGS
const logConfig = require('../conf/log-conf');
const loggerSettings = logConfig.getLogSettings();
const logger = require('js-logging').dailyFile([loggerSettings]);

module.exports = function (req, res, next) {
    //Authorization header: API_KEY:JWT_Token
    
    
    if(req.method == 'OPTIONS'){
        var headers = {};
        
        res.writeHead(200, headers);
        res.end();
    }else{
        var authorizationHeader = req.get('Authorization');
        
        if (authorizationHeader) {
            logger.info('Authorization a comprobar: ' + authorizationHeader);
            var token = authorizationHeader.split(':')[0];
            if (token) {
                logger.info('Token a comprobar: ' + token);
                var cert = fs.readFileSync('server/keys/public.pem');  // get public key 
                jwt.verify(token, cert, { algorithms: ['RS256'] }, function (err, decoded) {
                    if (err) {
                        logger.error('Error verificando token: ' + err);
                        return res.json({
                            'error': true,
                            'message': err,
                            'code': constants.REQUEST_ERROR_FORBIDDEN
                        });
                    } else {
                        logger.info('Acceso autorizado');
                        var decoded = jwt.decode(token, { complete: true });
                        next();
                    }
                });
            } else {
                // forbidden without token 
                logger.error('Acceso no autorizado');
                return res.status(constants.REQUEST_ERROR_FORBIDDEN).send({
                    'error': true,
                    'message': constants.REQUEST_ERROR_FORBIDDEN_MESSAGE,
                    'code': constants.REQUEST_ERROR_FORBBIDEN
                });
            }
        } else {
            // forbidden without token 
            logger.error('Acceso no autorizado');
            // return res.status(constants.REQUEST_ERROR_FORBIDDEN).send({
            //     'error': true,
            //     'message': constants.REQUEST_ERROR_FORBIDDEN_MESSAGE,
            //     'code': constants.REQUEST_ERROR_FORBBIDEN
            // });
        }
    }
    
 
    
    // if (authorizationHeader) {
    //     logger.info('Authorization a comprobar: ' + authorizationHeader);
    //     var token = authorizationHeader.split(':')[0];
    //     if (token) {
    //         logger.info('Token a comprobar: ' + token);
    //         var cert = fs.readFileSync('server/keys/public.pem');  // get public key 
    //         jwt.verify(token, cert, { algorithms: ['RS256'] }, function (err, decoded) {
    //             if (err) {
    //                 logger.error('Error verificando token: ' + err);
    //                 return res.json({
    //                     'error': true,
    //                     'message': err,
    //                     'code': constants.REQUEST_ERROR_FORBIDDEN
    //                 });
    //             } else {
    //                 logger.info('Acceso autorizado');
    //                 var decoded = jwt.decode(token, { complete: true });
    //                 next();
    //             }
    //         });
    //     } else {
    //         // forbidden without token 
    //         logger.error('Acceso no autorizado');
    //         return res.status(constants.REQUEST_ERROR_FORBIDDEN).send({
    //             'error': true,
    //             'message': constants.REQUEST_ERROR_FORBIDDEN_MESSAGE,
    //             'code': constants.REQUEST_ERROR_FORBBIDEN
    //         });
    //     }
    // } else {
    //     // forbidden without token 
    //     logger.error('Acceso no autorizado');
    //     return res.status(constants.REQUEST_ERROR_FORBIDDEN).send({
    //         'error': true,
    //         'message': constants.REQUEST_ERROR_FORBIDDEN_MESSAGE,
    //         'code': constants.REQUEST_ERROR_FORBBIDEN
    //     });
    // }
}