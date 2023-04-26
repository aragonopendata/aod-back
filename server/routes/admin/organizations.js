const express = require('express');
const router = express.Router();
const http = require('http');
const constants = require('../../util/constants');
const dbQueries = require('../../db/db-queries');
const proxy = require('../../conf/proxy-conf');
const request = require('request');
const utils = require('../../util/utils');
//Multer for receive form-data
const fs = require('fs-extra');
const multer  = require('multer')
const upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, callback) => {
        let path = '../../../assets/public/ckan/organizaciones';
        fs.mkdirsSync(path);
        callback(null, path);
      },
      filename: (req, file, callback) => {
        //originalname is the uploaded file's name with extn
        callback(null, file.originalname);
      }
    })
});

// FormData for send form-data
const formData = require('form-data');
//DB SETTINGS
const db = require('../../db/db-connection');
const pool = db.getPool();
//LOG SETTINGS
const logConfig = require('../../conf/log-conf');
const loggerSettings = logConfig.getLogSettings();
const logger = require('js-logging').dailyFile([loggerSettings]);

/** GET ALL ORGANIZATIONS */
router.get(constants.API_URL_ORGANIZATIONS, function (req, res, next) {
    try {
        logger.debug('Servicio: Listado de organizaciones');
        let serviceBaseUrl = constants.CKAN_API_BASE_URL;
        let serviceName = constants.ORGANIZATIONS_LIST;
        let serviceParams = '?all_fields=true';
        let serviceRequestUrl = serviceBaseUrl + serviceName + serviceParams;
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
                res.json(body);
            });
        }).on('error', function (err) {
            utils.errorHandler(err,res,serviceName);
        });
    } catch (error) {
        logger.error('Error in route' + constants.API_URL_ORGANIZATIONS);
    }
});

/* CREATE ORGANIZATION */
router.post(constants.API_URL_ADMIN_ORGANIZATION, upload.single('file'), function (req, res, next) {
    try {
        var file = req.file;
        var organization = req.body;
        console.log(file);
        if (file != undefined){
            organization.image_url='static/public/ckan/organizaciones/'+file.originalname;
        } else {
            organization.image_url='static/public/ckan/organizaciones/logoDGA.gif';
        }
        
        logger.notice('Organización que llega desde request: ' + organization.name);
        //0. CHECKING REQUEST PARAMETERS
            let apiKey = utils.getApiKey(req.get('Authorization'));
            if (apiKey) {
                 logger.info('API KEY del usuario recuperada: ' + apiKey);
                //2. INSERTING ORGANIZATION IN CKAN
                insertOrganizationInCkan(apiKey, organization)
                    .then(insertCkanResponse => {
                        logger.info('Respuesta de CKAN success: ' + insertCkanResponse.success);
                        if (insertCkanResponse && insertCkanResponse != null && insertCkanResponse.success) {
                            logger.info('Organización insertada ' + insertCkanResponse.result.name);
                            res.json({
                                'status': constants.REQUEST_REQUEST_OK,
                                'success': true,
                                'message': 'Organización insertada correctamente.'                   
                            });
                            return;
                        } else {
                            logger.error('ALTA DE ORGANIZACIONES - Error al insertar la organización en CKAN: ' + JSON.stringify(insertCkanResponse));
                            var errorJson = {
                                'status': constants.REQUEST_ERROR_BAD_DATA,
                                'error': 'ALTA DE ORGANIZACIONES - Error al insertar la organización en CKAN',
                            };
                            if (insertCkanResponse && insertCkanResponse != null
                                && insertCkanResponse.error && insertCkanResponse.error != null
                                && insertCkanResponse.error.name && insertCkanResponse.error.name != null) {
                                errorJson.message = insertCkanResponse.error.name;
                            }
                            res.json(errorJson);
                            return;
                        }
                    }).catch(error => {
                        logger.error('ALTA DE ORGANIZACIONES - Respuesta del servidor errónea: ' + error);
                        res.json({ 'status': constants.REQUEST_ERROR_BAD_DATA, 'error': 'ALTA DE ORGANIZACIONES - Respuesta del servidor errónea' });
                        return;
                    });
            } else {
                logger.error('ALTA DE ORGANIZACIONES - Usuario no autorizado');
                res.json({ 'status': constants.REQUEST_ERROR_FORBIDDEN, 'error': 'OBTENER USUARIO - API KEY incorrecta' });
                return;
            }
    } catch (error) {
        console.log(error);
        logger.error('ALTA DE ORGANIZACIONES - Error creando organización');
        res.json({ 'status': constants.REQUEST_ERROR_INTERNAL_ERROR, 'error': 'ALTA DE ORGANIZACIONES - Error creando organización' });
    }
});

/* UPDATE ORGANIZATION */
router.put(constants.API_URL_ADMIN_ORGANIZATION, function (req, res, next) {
    try {
        var organization = req.body;
        logger.notice('Organización que llega desde request: ' + organization.name);
        //0. CHECKING REQUEST PARAMETERS
        if ( organization.name != '') {
             let apiKey = utils.getApiKey(req.get('Authorization'));
             if (apiKey) {
                logger.info('API KEY del usuario recuperada: ' + apiKey);
                //2. UPDATING ORGANIZATION IN CKAN
                updateOrganizationInCkan(apiKey, organization)
                    .then(updateCkanResponse => {
                        logger.info('Respuesta de CKAN success: ' + updateCkanResponse.success);
                        if (updateCkanResponse && updateCkanResponse != null && updateCkanResponse.success) {
                            logger.info('Organización actualizada ' + updateCkanResponse.result.name);
                            res.json({
                                'status': constants.REQUEST_REQUEST_OK,
                                'success': 'true',
                                'message': 'Organización actualizada correctamente.'
                            });
                            return;
                        } else {
                            logger.error('ACTUALIZACIÓN DE ORGANIZACIONES - Error al actualizar la organización en CKAN: ' + JSON.stringify(updateCkanResponse));
                            var errorJson = {
                                'status': constants.REQUEST_ERROR_BAD_DATA,
                                'error': 'ACTUALIZACIÓN DE ORGANIZACIONES - Error al actualizar la organización en CKAN',
                            };
                            if (updateCkanResponse && updateCkanResponse != null
                                && updateCkanResponse.error && updateCkanResponse.error != null
                                && updateCkanResponse.error.name && updateCkanResponse.error.name != null) {
                                errorJson.message = updateCkanResponse.error.name;
                            }
                            res.json(errorJson);
                            return;
                        }
                    }).catch(error => {
                        logger.error('ACTUALIZACIÓN DE ORGANIZACIONES - Respuesta del servidor errónea: ' + error);
                        res.json({ 'status': constants.REQUEST_ERROR_BAD_DATA, 'error': 'ACTUALIZACIÓN DE ORGANIZACIONES - Respuesta del servidor errónea' });
                        return;
                    });
            } else {
                logger.error('ACTUALIZACIÓN DE ORGANIZACIONES - Usuario no autorizado');
                res.json({ 'status': constants.REQUEST_ERROR_FORBIDDEN, 'error': 'OBTENER USUARIO - API KEY incorrecta' });
                return;
            }
        } else {
            logger.error('ACTUALIZACIÓN DE ORGANIZACIONES - Parámetros incorrectos');
            res.json({ 'status': constants.REQUEST_ERROR_BAD_DATA, 'error': 'ACTUALIZACIÓN DE ORGANIZACIONES - Parámetros incorrectos' });
            return;
        }
    } catch (error) {
        logger.error('ACTUALIZACIÓN DE ORGANIZACIONES - Error actualizando organización');
        res.json({ 'status': constants.REQUEST_ERROR_INTERNAL_ERROR, 'error': 'ACTUALIZACIÓN DE ORGANIZACIONES - Error actualizando organización' });
    }
});

/* DELETE ORGANIZATION */
router.delete(constants.API_URL_ADMIN_ORGANIZATION, function (req, res, next) {
    try {
        var organization = req.body;
        logger.notice('Organización a borrar que llega desde request: ' + organization.name);
        //0. CHECKING REQUEST PARAMETERS
        if ( organization.name != '') {
            //1. CHEKING PERMISSIONS OF THE USER WHO MAKES THE REQUEST
            let apiKey = utils.getApiKey(req.get('Authorization'));
            if (apiKey) {
                logger.info('API KEY del usuario recuperada: ' + apiKey);
                //2. GET ALL DATASETS (PRIVATE AND PUBLICS) OF ORGANIZATION IN CKAN
                getDatasetsOfOrgInCkan(apiKey, organization)
                    .then(getDatasetsResponse => {
                        logger.info("Datasets recuperados");
                        logger.info(getDatasetsResponse);
                        //3 .DELETING DATASETS IN CKAN
                        deleteDatasetsInCkan(apiKey, getDatasetsResponse.results)
                            .then(deleteDatasetsResponse => {
                                //TODO
                                logger.info('Respuesta de CKAN success: ' + deleteDatasetsResponse);
                                if (deleteDatasetsResponse) {
                                    logger.info('Datasets borrados ');
                                    //4. DELETING ORGANIZATION IN CKAN
                                    //PURGE
                                        deleteOrganizationInCkan(apiKey, organization)
                                        .then(insertCkanResponse => {
                                            logger.info('Respuesta de CKAN success: ' + insertCkanResponse.success);
                                            if (insertCkanResponse && insertCkanResponse.result == null && insertCkanResponse.success) {
                                                logger.info('Organización borrada ' + organization.name);
                                                res.json({
                                                    'status': constants.REQUEST_REQUEST_OK,
                                                    'success': 'true',
                                                    'message': 'Organización borrada correctamente.'                             
                                                });
                                                return;
                                            } else {
                                                logger.error('BORRADO DE ORGANIZACIONES - Error al borrar la organización en CKAN: ' + JSON.stringify(insertCkanResponse));
                                                var errorJson = {
                                                    'status': constants.REQUEST_ERROR_BAD_DATA,
                                                    'error': 'BORRADO DE ORGANIZACIONES - Error al borrar la organización en CKAN',
                                                };
                                                if (insertCkanResponse && insertCkanResponse != null
                                                    && insertCkanResponse.error && insertCkanResponse.error != null
                                                    && insertCkanResponse.error.name && insertCkanResponse.error.name != null) {
                                                    errorJson.message = insertCkanResponse.error.name;
                                                }
                                                res.json(errorJson);
                                                return;
                                            }
                                        }).catch(error => {
                                            logger.error('BORRADO DE ORGANIZACIONES - Respuesta del servidor errónea: ' + error);
                                            res.json({ 'status': constants.REQUEST_ERROR_BAD_DATA, 'error': 'BORRADO DE ORGANIZACIONES - Respuesta del servidor errónea' });
                                            return;
                                        });
                                }else {
                                    logger.error('BORRADO DE ORGANIZACIONES - Error al borrar los datasets en CKAN: ' + JSON.stringify(insertCkanResponse));
                                    var errorJson = {
                                        'status': constants.REQUEST_ERROR_BAD_DATA,
                                        'error': 'BORRADO DE ORGANIZACIONES - Error al borrar la datasets en CKAN',
    
                                    };
                                    if (insertCkanResponse && insertCkanResponse != null
                                        && insertCkanResponse.error && insertCkanResponse.error != null
                                        && insertCkanResponse.error.name && insertCkanResponse.error.name != null) {
                                        errorJson.message = insertCkanResponse.error.name;
                                    }
                                    res.json(errorJson);
                                    return;
                                }
                            }).catch(error => {
                                logger.error('BORRADO DE ORGANIZACIONES - Respuesta del servidor errónea: ' + error);
                                res.json({ 'status': constants.REQUEST_ERROR_BAD_DATA, 'error': 'BORRADO DE ORGANIZACIONES - Respuesta del servidor errónea' });
                                return;
                            });
                    }).catch(error => {
                        logger.error('BORRADO DE ORGANIZACIONES - No se pudieron obtener los datasets: ' + error);
                        res.json({ 'status': constants.REQUEST_ERROR_BAD_DATA, 'error': 'BORRADO DE ORGANIZACIONES - No se pudieron obtener los datasets' });
                        return;
                    });
            } else {
                logger.error('OBTENER USUARIO - Usuario no autorizado');
                res.json({ 'status': constants.REQUEST_ERROR_FORBIDDEN, 'error': 'OBTENER USUARIO - API KEY incorrecta' });
                return;
            }
        } else {
            logger.error('BORRADO DE ORGANIZACIONES - Parámetros incorrectos');
            res.json({ 'status': constants.REQUEST_ERROR_BAD_DATA, 'error': 'BORRADO DE ORGANIZACIONES - Parámetros incorrectos' });
            return;
        }
    } catch (error) {
        logger.error('BORRADO DE ORGANIZACIONES - Error borrando organización');
        res.json({ 'status': constants.REQUEST_ERROR_INTERNAL_ERROR, 'error': 'BORRADO DE ORGANIZACIONES - Error borrando organización' });
    }
});
        

var insertOrganizationInCkan = function insertOrganizationInCkan(apiKey, organization) {
    return new Promise((resolve, reject) => {
        try {
            logger.debug('Insertando organización en CKAN');
            //Mandatory fields
            var create_organization_post_data = {
                'name': organization.name,
                'title': organization.title,
                'image_url': organization.image_url,
                'extras': []
            };
            //Optional fields
            if (organization.description != undefined) {
                create_organization_post_data.description = organization.description;
            }

            if(organization.extras != undefined){
                var extras = JSON.parse(organization.extras);
        
                for(var index=0; index<extras.length; index++){
                    if(extras[index].key =='webpage'){
                        create_organization_post_data.extras.push({"key": extras[index].key, "value": extras[index].value});
                    }
                    if (extras[index].key == 'address') {
                        create_organization_post_data.extras.push({"key": extras[index].key, "value": extras[index].value});
                    }
                    if (extras[index].key == 'person') {
                        create_organization_post_data.extras.push({"key": extras[index].key, "value": extras[index].value});
                    }
                    if (extras[index].key == 'siuCode') {
                        create_organization_post_data.extras.push({"key": extras[index].key, "value": extras[index].value});
                    }
                }
            }
            var httpRequestOptions = {
                url: constants.CKAN_API_BASE_URL + constants.CKAN_URL_PATH_ORGANIZATION_CREATE,
                method: constants.HTTP_REQUEST_METHOD_POST,
                body: create_organization_post_data,
                json: true,
                headers: {
                    'Content-Type': constants.HTTP_REQUEST_HEADER_CONTENT_TYPE_JSON,
                    'User-Agent': constants.HTTP_REQUEST_HEADER_USER_AGENT_NODE_SERVER_REQUEST,
                    'Authorization': apiKey
                }
            };
            request(httpRequestOptions, function (err, res, body) {
                if (err) {
                    reject(err);
                }
                if (res) {
                    if (res.statusCode == 200) {
                        logger.info('Código de respuesta: : ' + JSON.stringify(res.statusCode));
                        resolve(body);
                    } else {
                        reject(JSON.stringify(res.statusCode) + ' - ' + JSON.stringify(res.statusMessage));
                    }
                } else {
                    reject('Respuesta nula');
                }
            });
        } catch (error) {
            reject(error);
        }
    });
}

var updateOrganizationInCkan = function updateOrganizationInCkan(apiKey, organization) {
    return new Promise((resolve, reject) => {
        try {         
            logger.debug('Actualizando organización en CKAN');      
            var httpRequestOptions = {
                url: constants.CKAN_API_BASE_URL + constants.CKAN_URL_PATH_ORGANIZATION_UPDATE,
                method: constants.HTTP_REQUEST_METHOD_POST,
                body: organization,
                json: true,
                headers: {
                    'Content-Type': constants.HTTP_REQUEST_HEADER_CONTENT_TYPE_JSON,
                    'User-Agent': constants.HTTP_REQUEST_HEADER_USER_AGENT_NODE_SERVER_REQUEST,
                    'Authorization': apiKey
                }
            };

            request(httpRequestOptions, function (err, res, body) {
                if (err) {
                    reject(err);
                }
                if (res) {
                    if (res.statusCode == 200) {
                        logger.info('Código de respuesta: : ' + JSON.stringify(res.statusCode));
                        logger.info('Respuesta: ' + JSON.stringify(body));
                        resolve(body);
                    } else {
                        reject(JSON.stringify(res.statusCode) + ' - ' + JSON.stringify(res.statusMessage));
                    }
                } else {
                    reject('Respuesta nula');
                }
            });
        } catch (error) {
            reject(error);
        }
    });
}

var getDatasetsOfOrgInCkan = function getDatasetsOfOrgInCkan(apiKey, organization) {
    return new Promise((resolve, reject) => {
        try {
            logger.debug('Llamando DATASETS de la organización en CKAN');
            
            //Mandatory fields
            var httpRequestOptions = {
                url: constants.CKAN_API_BASE_URL + constants.DATASETS_SEARCH + '?fq=organization:' +  organization.name + '&include_private=true',
                method: constants.HTTP_REQUEST_METHOD_GET,
                headers: {
                    'Content-Type': constants.HTTP_REQUEST_HEADER_CONTENT_TYPE_JSON,
                    'User-Agent': constants.HTTP_REQUEST_HEADER_USER_AGENT_NODE_SERVER_REQUEST,
                    'Authorization': apiKey
                }
            };
            
            request(httpRequestOptions, function (err, res, body) {
                if (err) {
                    reject(err);
                }
                if (res) {
                    if (res.statusCode == 200) {
                        logger.info('Código de respuesta: : ' + JSON.stringify(res.statusCode));
                        logger.info('Respuesta: ' + JSON.stringify(res));
                        var data = JSON.parse(body);
                        resolve(data.result);
                    } else {
                        reject(JSON.stringify(res.statusCode) + ' - ' + JSON.stringify(res.statusMessage));
                    }
                } else {
                    reject('Respuesta nula');
                }
            });
        } catch (error) {
            console.log(error);
            reject(error);
        }
    });
}

var deleteDatasetsInCkan = function deleteDatasetsInCkan(apiKey, datasets) {
    return new Promise((resolve, reject) => {
        try {
            if (datasets.length > 0 ) {
                for (var i = 0; i < datasets.length; i++) {
                    //Mandatory fields
                    var delete_dataset_post_data = {
                        'id': datasets[i].name
                    };
    
                    var httpRequestOptions = {
                        url: constants.CKAN_API_BASE_URL + constants.CKAN_URL_PATH_DATASET_PURGE,
                        method: constants.HTTP_REQUEST_METHOD_POST,
                        body: delete_dataset_post_data,
                        json: true,
                        headers: {
                            'Content-Type': constants.HTTP_REQUEST_HEADER_CONTENT_TYPE_JSON,
                            'User-Agent': constants.HTTP_REQUEST_HEADER_USER_AGENT_NODE_SERVER_REQUEST,
                            'Authorization': apiKey
                        }
                    };
                    logger.info('Configuraćión llamada POST: ' + JSON.stringify(httpRequestOptions));
                    request(httpRequestOptions, function (err, res, body) {
                        if (err) {
                            reject(err);
                        }
                        if (res) {
                            if (res.body.success) {
                                resolve(res.body.success);
                            } else {
                                reject(JSON.stringify(res.statusCode) + ' - ' + JSON.stringify(res.statusMessage));
                            }
                        } else {
                            reject('Respuesta nula');
                        }
                    });
                }
            } else {
                logger.info('La organización no contiene datasets.');
                resolve(true);
            }
        } catch (error) {
            console.log(error);
            reject(error);
        }
    });
}

var deleteOrganizationInCkan = function deleteOrganizationInCkan(apiKey, organization) {
    return new Promise((resolve, reject) => {
        try {
            logger.debug('Borrando organización en CKAN');
            //Mandatory fields
            var delete_organization_post_data = {
                'id': organization.name
            };
            var httpRequestOptions = {
                url: 'http://localhost:5000/api/action/' + constants.CKAN_URL_PATH_ORGANIZATION_PURGE,
                method: constants.HTTP_REQUEST_METHOD_POST,
                body: delete_organization_post_data,
                json: true,
                headers: {
                    'Content-Type': constants.HTTP_REQUEST_HEADER_CONTENT_TYPE_JSON,
                    'User-Agent': constants.HTTP_REQUEST_HEADER_USER_AGENT_NODE_SERVER_REQUEST,
                    'Authorization': apiKey
                }
            };
            logger.info(delete_organization_post_data);
            request(httpRequestOptions, function (err, res, body) {
                if (err) {
                    reject(err);
                }
                if (res) {
                    if (res.statusCode == 200) {
                        logger.info('Código de respuesta: : ' + JSON.stringify(res.statusCode));
                        resolve(body);
                    } else {
                        reject(JSON.stringify(res.statusCode) + ' - ' + JSON.stringify(res.statusMessage));
                    }
                } else {
                    reject('Respuesta nula');
                }
            });
        } catch (error) {
            console.log(error);
            reject(error);
        }
    });
}

var getUserPermissions = function checkUserPermissions(userId, userName) {
    return new Promise((resolve, reject) => {
        try {
            const query = {
                text: dbQueries.DB_ADMIN_GET_USER_APP_PERMISSIONS,
                values: [userId, userName, constants.APPLICATION_NAME_CKAN],
                rowMode: constants.SQL_RESULSET_FORMAT_JSON
            };
            pool.connect((connError, client, release) => {
                if (connError) {
                  return console.error('Error acquiring client', connError.stack)
                }
                client.query(query, (err, queryResult) => {
                  release()
                  if (err) {
                    return console.error('Error executing query', err.stack)
                  }else{
                    resolve(queryResult.rows[0]);
                  }

                })
              })
        } catch (error) {
            reject(error);
        }
   });
}

/* TODO DELETE */
// router.post(constants.API_URL_DATASETS+ constants.API_URL_ORGANIZATION + '/:orgName' , function (req, res, next) {
//     try {
//         var dataset = req.body;
//         logger.notice('Dataset que llega desde request: ' + JSON.stringify(dataset))

//         logger.debug('Servicio: Obtener datasets de organización');
//         //Mandatory fields
//         if (dataset.requestUserId != '' && dataset.requestUserName != ''){
//             var requestUserId = dataset.requestUserId;
//             var requestUserName = dataset.requestUserName;
            
//             getUserPermissions(requestUserId, requestUserName)
//             .then(accessInfo => {
//                 if (accessInfo) {
//                     logger.info('Permiso recuperado para usuario ' + requestUserName);
//                     var httpRequestOptions = {
//                         host: 'localhost',
//                         port: 5000,
//                         path: '/api/action/' + constants.DATASETS_SEARCH + '?fq=organization:' +  req.params.orgName + '&include_private=true',
//                         method: constants.HTTP_REQUEST_METHOD_GET,
//                         headers: {
//                             'Authorization': accessInfo.accessKey
//                         }
//                     };
//                     logger.info('Petición: ' + JSON.stringify(httpRequestOptions))
    
//                     http.get(httpRequestOptions,function (results) {
//                         var body = '';
//                         results.on('data', function (chunk) {
//                             body += chunk;
//                         });
//                         results.on('end', function () {
//                             res.json(body);
//                         });
//                     }).on('error', function (err) {
//                         utils.errorHandler(err,res,serviceName);
//                     });
//                 } else { //TODO
//                     // logger.error('INSERCCIÓN DE DATASETS - Usuario no autorizado: ', error);
//                     // res.json({ 'status': constants.REQUEST_ERROR_FORBIDDEN, 'error': 'INSERCCIÓN DE DATASETS - Usuario no autorizado' });
//                     // return;
//                 }
//             }).catch(error => {
//                 logger.error('INSERCCIÓN DE DATASETS - Usuario no autorizado: ', error);
//                 res.json({ 'status': constants.REQUEST_ERROR_FORBIDDEN, 'error': 'INSERCCIÓN DE DATASETS - Usuario no autorizado' });
//                 return;
//             });
//         }else{
//             logger.error('INSERCCIÓN DE DATASETS - Parámetros incorrectos');
//             res.json({ 'status': constants.REQUEST_ERROR_BAD_DATA, 'error': 'INSERCCIÓN DE DATASETS - Parámetros incorrectos' });
//             return;
//         }
        
//     } catch (error) {
//         logger.error('Error in route' + constants.API_URL_ORGANIZATION);
//     }
// });

module.exports = router;