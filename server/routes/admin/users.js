const express = require('express');
const router = express.Router();
const http = require('http');
const constants = require('../../util/constants');
const utils = require('../../util/utils');
const dbQueries = require('../../db/db-queries');
const CryptoJS = require('crypto-js');
const SHA256 = require('crypto-js/sha256');
const request = require('request');
const proxy = require('../../conf/proxy-conf');
//DB SETTINGS
const db = require('../../db/db-connection');
const pool = db.getPool();
//LOG SETTINGS
const logConfig = require('../../conf/log-conf');
const loggerSettings = logConfig.getLogSettings();
const logger = require('js-logging').dailyFile([loggerSettings]);

/** GET USERS */
router.get('/users', function (req, res, next) {
    try {
        logger.debug('Servicio: Listado de usuarios');
        pool.connect(function(err, client, done) {
            const queryDb = {
                text: dbQueries.DB_ADMIN_GET_USERS_JSON,
                rowMode: constants.SQL_RESULSET_FORMAT_JSON
            };
            client.query(queryDb, function (err, result) {
                done()
                if (err) {
                    logger.error('LISTADO DE USUARIOS - Error obteniendo el listado: ', err);
                    res.json({ 'status': constants.REQUEST_ERROR_INTERNAL_ERROR, 'error': 'OBTENER USUARIO - Error obteniendo el listado' });
                }
                res.json(result.rows);  
            })
        }).catch(connError => {
            logger.error('LISTADO DE USUARIOS - Error en la conexión con base de datos: ', connError);
            res.json({ 'status': constants.REQUEST_ERROR_INTERNAL_ERROR, 'error': 'LISTADO DE USUARIOS - Error en la conexión con base de datos' });
            return;
        })
    } catch (error) {
        logger.error('LISTADO DE USUARIOS - Error obteniendo el listado: ', error);
        //res.json({ 'status': constants.REQUEST_ERROR_INTERNAL_ERROR, 'error': 'LISTADO DE USUARIOS - Error obteniendo el listado' });
         
        return;

    }
});

/** GET USER BY ID */
router.get('/users/:userId', function (req, res, next) {
    try {
        logger.debug('Servicio: Obtención de un usuario');
        //0. CHECKING REQUEST PARAMETERS
        if (req.params.userId && req.params.userId != '') {            
            let apiKey = utils.getApiKey(req.get('Authorization'));
            if (apiKey) {
                logger.info('API KEY del usuario recuperada: ' + apiKey);
                getUserFromCkan(apiKey, req.params.userId).then(getUserResponse => {
                    logger.info('Respuesta de CKAN: ' + getUserResponse.success);
                    if (getUserResponse) {
                        res.json(getUserResponse);
                    } else {
                        logger.error('OBTENER USUARIO - Error al obtener el usuario de CKAN: ' + JSON.stringify(getOrganizationResponse));
                        let errorJson = {
                            'status': constants.REQUEST_ERROR_INTERNAL_ERROR,
                            'error': 'OBTENER USUARIO - Error al obtener el usuario de CKAN',
                        };
                        if (getUserResponse && getUserResponse != null
                                && getUserResponse.error && getUserResponse.error != null
                                && getUserResponse.error.name && getUserResponse.error.name != null) {
                            errorJson.message = getUserResponse.error.name;
                        }
                        res.json(errorJson);
                        return;
                    }
                }).catch(error => {
                    logger.error('OBTENER USUARIO - Error al recuperar los datos del usuario: ', error);
                    res.json({ 'status': constants.REQUEST_ERROR_INTERNAL_ERROR, 'error': 'OBTENER USUARIO - Error al recuperar los datos del usuario' });
                    return;
                });
            } else {
                logger.error('OBTENER USUARIO - Usuario no autorizado');
                res.json({ 'status': constants.REQUEST_ERROR_FORBIDDEN, 'error': 'OBTENER USUARIO - API KEY incorrecta' });
                return;
            }
        } else {
            logger.error('OBTENER USUARIO - Parámetros incorrectos');
            res.json({ 'status': constants.REQUEST_ERROR_BAD_DATA, 'error': 'OBTENER USUARIO - Parámetros incorrectos' });
            return;
        }
    } catch (error) {
        logger.error('OBTENER USUARIOS - Error obteniendo el usuario: ', error);
        res.json({ 'status': constants.REQUEST_ERROR_INTERNAL_ERROR, 'error': 'OBTENER USUARIOS - Error obteniendo el usuario' });
        return;
    }
});

/** GET USER's ORGANIZATIONS FOR LOGGED USER */
router.get('/users/:userId/organizations', function (req, res, next) {
    try {
        logger.debug('Servicio: Listado de organizaciones del usuario');
        if (req.params.userId && req.params.userId != '') {
            let apiKey = utils.getApiKey(req.get('Authorization'));
            if (apiKey) {
                logger.info('API KEY del usuario recuperada: ' + apiKey);
                getUserOrganizations(apiKey).then(getOrganizationResponse => {
                    logger.info('Respuesta de CKAN: ' + getOrganizationResponse);
                    if (getOrganizationResponse) {
                        res.json(getOrganizationResponse);
                    } else {
                        logger.error('OBTENER ORGANIZACIONES DE USUARIO - Error al obtener las organizaciones de CKAN: ' + JSON.stringify(getOrganizationResponse));
                        var errorJson = {
                            'status': constants.REQUEST_ERROR_INTERNAL_ERROR,
                            'error': 'OBTENER ORGANIZACIONES DE USUARIO - Error al obtener las organizaciones de CKAN',
                        };
                        if (getOrganizationResponse && getOrganizationResponse != null
                                && getOrganizationResponse.error && getOrganizationResponse.error != null
                                && getOrganizationResponse.error.name && getOrganizationResponse.error.name != null) {
                            errorJson.message = getOrganizationResponse.error.name;
                        }
                        res.json(errorJson);
                        return;
                    }
                }).catch(error => {
                    logger.error('OBTENER ORGANIZACIONES DE USUARIO - Error al obtener las organizaciones del usuario: ', error);
                    res.json({ 'status': constants.REQUEST_ERROR_INTERNAL_ERROR, 'error': 'OBTENER ORGANIZACIONES DE USUARIO - Error al obtener las organizaciones del usuario' });
                    return;
                });
            } else {
                logger.error('OBTENER ORGANIZACIONES DE USUARIO - Usuario no autorizado: ', error);
                res.json({ 'status': constants.REQUEST_ERROR_FORBIDDEN, 'error': 'OBTENER ORGANIZACIONES DE USUARIO - Usuario no autorizado' });
                return;
            }
        } else {
            logger.error('OBTENER ORGANIZACIONES DE USUARIO - Parámetros incorrectos');
            res.json({ 'status': constants.REQUEST_ERROR_BAD_DATA, 'error': 'OBTENER ORGANIZACIONES DE USUARIO - Parámetros incorrectos' });
            return;
        }
    } catch (error) {
        logger.error('OBTENER ORGANIZACIONES DE USUARIO - Error al obtener las organizaciones del usuario: ', error);
        res.json({ 'status': constants.REQUEST_ERROR_INTERNAL_ERROR, 'error': 'OBTENER ORGANIZACIONES DE USUARIO - Error al obtener las organizaciones del usuario' });
        return;
    }
});

/** GET USER's ORGANIZATIONS */
router.post('/users/:userId/organizations', function (req, res, next) {
    try {
        logger.debug('Servicio: Listado de organizaciones del usuario');
        if (req.params.userId && req.params.userId != '') {
            let apiKey = utils.getApiKey(req.get('Authorization'));
            if (apiKey) {
                logger.info('API KEY del usuario recuperada: ' + req.body.apiKey);
                getUserOrganizations(req.body.apikey).then(getOrganizationResponse => {
                    logger.info('Respuesta de CKAN: ' + getOrganizationResponse);
                    if (getOrganizationResponse) {
                        res.json(getOrganizationResponse);
                    } else {
                        logger.error('OBTENER ORGANIZACIONES DE USUARIO - Error al obtener las organizaciones de CKAN: ' + JSON.stringify(getOrganizationResponse));
                        var errorJson = {
                            'status': constants.REQUEST_ERROR_INTERNAL_ERROR,
                            'error': 'OBTENER ORGANIZACIONES DE USUARIO - Error al obtener las organizaciones de CKAN',
                        };
                        if (getOrganizationResponse && getOrganizationResponse != null
                                && getOrganizationResponse.error && getOrganizationResponse.error != null
                                && getOrganizationResponse.error.name && getOrganizationResponse.error.name != null) {
                            errorJson.message = getOrganizationResponse.error.name;
                        }
                        res.json(errorJson);
                        return;
                    }
                }).catch(error => {
                    logger.error('OBTENER ORGANIZACIONES DE USUARIO - Error al obtener las organizaciones del usuario: ', error);
                    res.json({ 'status': constants.REQUEST_ERROR_INTERNAL_ERROR, 'error': 'OBTENER ORGANIZACIONES DE USUARIO - Error al obtener las organizaciones del usuario' });
                    return;
                });
            } else {
                logger.error('OBTENER ORGANIZACIONES DE USUARIO - Usuario no autorizado: ', error);
                res.json({ 'status': constants.REQUEST_ERROR_FORBIDDEN, 'error': 'OBTENER ORGANIZACIONES DE USUARIO - Usuario no autorizado' });
                return;
            }
        } else {
            logger.error('OBTENER ORGANIZACIONES DE USUARIO - Parámetros incorrectos');
            res.json({ 'status': constants.REQUEST_ERROR_BAD_DATA, 'error': 'OBTENER ORGANIZACIONES DE USUARIO - Parámetros incorrectos' });
            return;
        }
    } catch (error) {
        logger.error('OBTENER ORGANIZACIONES DE USUARIO - Error al obtener las organizaciones del usuario: ', error);
        res.json({ 'status': constants.REQUEST_ERROR_INTERNAL_ERROR, 'error': 'OBTENER ORGANIZACIONES DE USUARIO - Error al obtener las organizaciones del usuario' });
        return;
    }
});

/** CREATE NEW USER */
router.post('/users', function (req, res, next) {
    try {
        var user = req.body;
        logger.notice('Usuario que llega desde request: ' + JSON.stringify(user));
        //0. CHECKING REQUEST PARAMETERS
        if (user.name != '' && user.email != '' && user.password != '' && user.role != '' && user.organization != '') {
            let userOrganization = user.organization;
            delete user.organization;
            //1. CHEKING PERMISSIONS OF THE USER WHO MAKES THE REQUEST
            let apiKey = utils.getApiKey(req.get('Authorization'));
            if (apiKey) {
                logger.info('API KEY del usuario recuperada: ' + apiKey);
                //2. INSERTING USER IN CKAN
                insertUserInCkan(apiKey, user).then(insertCkanResponse => {
                    logger.info('Respuesta de CKAN: ' + insertCkanResponse.success);
                    if (insertCkanResponse && insertCkanResponse != null && insertCkanResponse.success) {
                        logger.info('Usuario insertado: ' + insertCkanResponse.result.fullname);
                        //3. INSERTING USER IN AOD_MANAGER AND ASSIGNING PERMISSIONS
                        insertUserInManager(user, insertCkanResponse.result).then(userId => {
                            logger.info('Usuario asociado a rol: ' + userId);
                            // GET CKAN GROUPS
                            getCkanGroups(apiKey).then(groupsResponse => {
                                if (groupsResponse) {
                                    setGroupsToUser(apiKey, user, groupsResponse).then(setGroupsToUserResponse => {
                                        if (setGroupsToUserResponse) {
                                            setOrganizationToUser(apiKey, user, userOrganization).then(setOrganizationToUserResponse => {
                                                if(setOrganizationToUserResponse){
                                                    res.json({
                                                        'status': constants.REQUEST_REQUEST_OK,
                                                        'success': true,
                                                        'result': 'ALTA DE USUARIOS - Usuario dado de alta correctamente'
                                                    });
                                                    logger.info('ALTA DE USUARIOS - Usuario dado de alta correctamente')
                                                }else{
                                                    logger.error('ALTA DE USUARIOS - No se ha podido asociar el usuario a la organización');
                                                    res.json({ 'status': constants.REQUEST_ERROR_INTERNAL_ERROR, 'error': 'ALTA DE USUARIOS - No se ha podido insertar el usuario en base de datos' });
                                                    return;
                                                }
                                            })
                                        } else {
                                            logger.error('ALTA DE USUARIOS - No se ha podido insertar el usuario en base de datos');
                                            res.json({ 'status': constants.REQUEST_ERROR_INTERNAL_ERROR, 'error': 'ALTA DE USUARIOS - No se ha podido insertar el usuario en base de datos' });
                                            return;
                                        }
                                    })
                                } else {
                                    logger.error('ALTA DE USUARIOS - No se ha podido obtener la lista de temas');
                                    res.json({ 'status': constants.REQUEST_ERROR_INTERNAL_ERROR, 'error': 'ALTA DE USUARIOS - No se ha podido obtener la lista de temas' });
                                    return;
                                }
                            })
                        }).catch(error => {
                            logger.error('ALTA DE USUARIOS - Error al insertar al usuario en base de datos: ', error);
                            res.json({ 'status': constants.REQUEST_ERROR_INTERNAL_ERROR, 'error': 'ALTA DE USUARIOS - Error al insertar al usuario en base de datos' });
                            return;
                        });
                    } else {
                        logger.error('ALTA DE USUARIOS - Error al insertar al usuario en CKAN: ' + JSON.stringify(insertCkanResponse));
                        var errorJson = {
                            'status': constants.REQUEST_ERROR_INTERNAL_ERROR,
                            'error': 'ALTA DE USUARIOS - Error al insertar al usuario en CKAN',

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
                    if (error == '409 - "Conflict"') {
                        res.json({
                            'status': constants.REQUEST_ERROR_CONFLICT, 'error': 'ALTA DE USUARIOS - Conflicto al crear usuario', 'message': 'Nombre del usuario en uso'
                        });
                    } else {
                        res.json({ 'status': constants.REQUEST_ERROR_INTERNAL_ERROR, 'error': 'ALTA DE USUARIOS - Respuesta del servidor errónea' });
                    }
                    logger.error('ALTA DE USUARIOS - Respuesta del servidor errónea: ', error);
                    return;
                });
            } else {
                logger.error('ALTA DE USUARIOS - Usuario no autorizado: ', error);
                res.json({ 'status': constants.REQUEST_ERROR_FORBIDDEN, 'error': 'ALTA DE USUARIOS - Usuario no autorizado' });
                return;
            }
        } else {
            logger.error('ALTA DE USUARIOS - Parámetros incorrectos');
            res.json({ 'status': constants.REQUEST_ERROR_BAD_DATA, 'error': 'ALTA DE USUARIOS - Parámetros incorrectos' });
            return;
        }
    } catch (error) {
        logger.error('ALTA DE USUARIOS - Error creando usuario: ', error);
        res.json({ 'status': constants.REQUEST_ERROR_INTERNAL_ERROR, 'error': 'ALTA DE USUARIOS - Error creando usuario' });
        return;
    }
});

/** UPDATE USER */
router.put('/users/:userId', function (req, res, next) {
    try {
        var user = req.body;
        if (user.name != '' && user.description != '' 
                && user.email != '' && user.fullname != '' 
                && user.role != '' && user.active != '' && user.role != '' 
                && req.params.userId && req.params.userId != ''
                && user.id == req.params.userId) {
            let userOrganization = user.organization;

            let userOrganizationOld = null;
            if(user.organization_old != null){
                userOrganizationOld = user.organization_old;
                delete user.organization_old;
            }
            delete user.organization;
            //1. CHEKING PERMISSIONS OF THE USER WHO MAKES THE REQUEST
            let apiKey = utils.getApiKey(req.get('Authorization'));
            if (apiKey) {
                logger.info('API KEY del usuario recuperada: ' + apiKey);
                getUserFromCkan(apiKey, user.name).then(userInCkan => {
                    if (userInCkan && userInCkan != null) {
                        updateUserInCkan(apiKey, userInCkan, user).then(updateUserInCkanResponse => {
                            if (updateUserInCkanResponse && updateUserInCkanResponse != null) {
                                updateUserInManager(user, updateUserInCkanResponse).then(updateUserInManager => {
                                    if (updateUserInManager) {
                                        if ( userOrganizationOld != null){
                                            deleteOrganizationOfUser(apiKey, user, userOrganizationOld).then(deleteOrganizationOfUserResponse => {
                                                if (deleteOrganizationOfUserResponse){
                                                    setOrganizationToUser(apiKey, user, userOrganization).then(setOrganizationToUserResponse => {
                                                        if(setOrganizationToUserResponse){
                                                            logger.info('ACTUALIZACIÓN DE USUARIOS - Usuario actualizado correctamente')
                                                            res.json({
                                                                'status': constants.REQUEST_REQUEST_OK,
                                                                'success': true,
                                                                'result': 'ACTUALIZACIÓN DE USUARIOS - Usuario actualizado correctamente'
                                                            });
                                                        }else{
                                                            logger.error('ACTUALIZACIÓN DE USUARIOS - No se ha podido asociar el usuario a la organización');
                                                            res.json({ 'status': constants.REQUEST_ERROR_INTERNAL_ERROR, 'error': 'ALTA DE USUARIOS - No se ha podido insertar el usuario en base de datos' });
                                                            return;
                                                        }
                                                    })
                                                } else {
                                                    logger.error('ACTUALIZACIÓN DE USUARIOS - No se ha podido borrar el usuario de la organización');
                                                    res.json({ 'status': constants.REQUEST_ERROR_INTERNAL_ERROR, 'error': 'ALTA DE USUARIOS - No se ha podido borrar el usuario de la organización' });
                                                    return;
                                                }
                                            });
                                        } else if (userOrganization != null && userOrganizationOld == null) {
                                            setOrganizationToUser(apiKey, user, userOrganization).then(setOrganizationToUserResponse => {
                                                if(setOrganizationToUserResponse){
                                                    logger.info('ACTUALIZACIÓN DE USUARIOS - Usuario actualizado correctamente')
                                                    res.json({
                                                        'status': constants.REQUEST_REQUEST_OK,
                                                        'success': true,
                                                        'result': 'ACTUALIZACIÓN DE USUARIOS - Usuario actualizado correctamente'
                                                    });
                                                }else{
                                                    logger.error('ACTUALIZACIÓN DE USUARIOS - No se ha podido asociar el usuario a la organización');
                                                    res.json({ 'status': constants.REQUEST_ERROR_INTERNAL_ERROR, 'error': 'ALTA DE USUARIOS - No se ha podido insertar el usuario en base de datos' });
                                                    return;
                                                }
                                            })
                                        } else {
                                            logger.info('ACTUALIZACIÓN DE USUARIOS - Usuario admin actualizado correctamente')
                                            res.json({
                                                'status': constants.REQUEST_REQUEST_OK,
                                                'success': true,
                                                'result': 'ACTUALIZACIÓN DE USUARIOS - Usuario admin actualizado correctamente'
                                            });
                                        }
                                    } else {
                                        logger.error('ACTUALIZACIÓN DE USUARIOS - Error al actualizar al usuario de la base de datos: ', error);
                                        res.json({ 'status': constants.REQUEST_ERROR_INTERNAL_ERROR, 'error': 'ACTUALIZACIÓN DE USUARIOS - Error al actualizar al usuario de la base de datos' });
                                    }
                                }).catch(error => {
                                    logger.error('ACTUALIZACIÓN DE USUARIOS - Error al actualizar al usuario en base de datos: ', error);
                                    res.json({ 'status': constants.REQUEST_ERROR_INTERNAL_ERROR, 'error': 'ACTUALIZACIÓN DE USUARIOS - Error al actualizar al usuario en base de datos' });
                                    return;
                                });
                            } else {
                                logger.error('ACTUALIZACIÓN DE USUARIOS - Error al actualizar al usuario de la base de datos');
                                res.json({ 'status': constants.REQUEST_ERROR_INTERNAL_ERROR, 'error': 'ACTUALIZACIÓN DE USUARIOS - Error al actualizar al usuario de la base de datos' });
                                return;
                            }
                        }).catch(error => {
                            logger.error('ACTUALIZACIÓN DE USUARIOS - Error al actualizar al usuario en CKAN: ', error);
                            res.json({ 'status': constants.REQUEST_ERROR_INTERNAL_ERROR, 'error': 'ACTUALIZACIÓN DE USUARIOS - Error al actualizar al usuario en CKAN' });
                            return;
                        });
                    } else {
                        logger.error('ACTUALIZACIÓN DE USUARIOS - Error al recuperar los datos del usuario de CKAN');
                        res.json({ 'status': constants.REQUEST_ERROR_INTERNAL_ERROR, 'error': 'ACTUALIZACIÓN DE USUARIOS - Error al recuperar los datos del usuario de CKAN' });
                        return;
                    }
                }).catch(error => {
                    logger.error('ACTUALIZACIÓN DE USUARIOS - Error al recuperar los datos del usuario de CKAN: ', error);
                    res.json({ 'status': constants.REQUEST_ERROR_INTERNAL_ERROR, 'error': 'ACTUALIZACIÓN DE USUARIOS - Error al recuperar los datos del usuario de CKAN' });
                    return;
                });
            } else {
                logger.error('ACTUALIZACIÓN DE USUARIOS - Usuario no autorizado: ', error);
                res.json({ 'status': constants.REQUEST_ERROR_FORBIDDEN, 'error': 'ACTUALIZACIÓN DE USUARIOS - Usuario no autorizado' });
                return;
            }
        } else {
            logger.error('ACTUALIZACIÓN DE USUARIOS - Parámetros incorrectos');
            res.json({ 'status': constants.REQUEST_ERROR_BAD_DATA, 'error': 'ACTUALIZACIÓN DE USUARIOS - Parámetros incorrectos' });
            return;
        }
    } catch (error) {
        logger.error('ACTUALIZACIÓN DE USUARIOS - Error actualizando usuario: ' , error);
        res.json({ 'status': constants.REQUEST_ERROR_INTERNAL_ERROR, 'error': 'ACTUALIZACIÓN DE USUARIOS - Error actualizando usuario' });
        return;
    }
});

/** DELETE USER */
router.delete('/users/:userId', function (req, res, next) {
    try {
        var userNameCkan = req.body.userNameCkan;
        var userIdDb = req.params.userId;
        //0. CHECKING REQUEST PARAMETERS
        if (userNameCkan != '' && userNameCkan != undefined && userIdDb != '' && userIdDb != undefined ) {       
            //1. CHEKING PERMISSIONS OF THE USER WHO MAKES THE REQUEST
            let apiKey = utils.getApiKey(req.get('Authorization'));
            if (apiKey) {
                logger.info('API KEY del usuario recuperada: ' + apiKey);
                // 2. DELETE USER IN CKAN
                deleteUserInCkan(apiKey, userNameCkan).then(deleteCkanResponse => {
                    if (deleteCkanResponse && deleteCkanResponse != null && deleteCkanResponse.success) {
                        deleteUserInManager(userIdDb).then(deleteUserInManagerResponse => {
                            if (deleteUserInManagerResponse) {
                                logger.info('Usuario borrado de BBDD');
                                res.json({
                                    'status': constants.REQUEST_REQUEST_OK,
                                    'success': true,
                                    'result': 'BORRADO DE USUARIOS - Usuario borrado correctamente'
                                });
                            } else {
                                logger.error('BORRADO DE USUARIOS - Error al borrar al usuario de base de datos: ');
                                res.json({ 'status': constants.REQUEST_ERROR_INTERNAL_ERROR, 'error': 'BORRADO DE USUARIOS - Error al borrar al usuario en base de datos' });
                                return;
                            }
                        }).catch(error => {
                            logger.error('BORRADO DE USUARIOS - Error al borrar al usuario de base de datos: ', error);
                            res.json({ 'status': constants.REQUEST_ERROR_INTERNAL_ERROR, 'error': 'BORRADO DE USUARIOS - Error al borrar al usuario en base de datos' });
                            return;
                        });
                    } else {
                        logger.error('BORRADO DE USUARIOS - Error al borrar al usuario de CKAN: ');
                        var errorJson = {
                            'status': constants.REQUEST_ERROR_INTERNAL_ERROR,
                            'error': 'BORRADO - Error al borrar al usuario de CKAN',
                        };
                        res.json(errorJson);
                        return;
                    }
                }).catch(error => {
                    logger.error('BORRADO DE USUARIOS - Error borrando el usuario en CKAN: ', error);
                    res.json({ 'status': constants.REQUEST_ERROR_INTERNAL_ERROR, 'error': 'ALTA DE USUARIOS - Error borrando el usuario en CKAN' });
                    return;
                });
            } else {
                logger.error('BORRADO DE USUARIOS - Usuario no autorizado: ');
                res.json({ 'status': constants.REQUEST_ERROR_FORBIDDEN, 'error': 'ALTA DE USUARIOS - Usuario no autorizado' });
                return;
            }
        } else {
            logger.error('BORRADO DE USUARIOS - Parámetros incorrectos');
            res.json({ 'status': constants.REQUEST_ERROR_BAD_DATA, 'error': 'ALTA DE USUARIOS - Parámetros incorrectos' });
            return;
        }
    } catch (error) {
        logger.error('BORRADO DE USUARIOS - Error borrando usuario', error);
        res.json({ 'status': constants.REQUEST_ERROR_INTERNAL_ERROR, 'error': 'BORRADO DE USUARIOS - Error borrando usuario' });
        return;
    }
});

var getUserFromCkan = function getUserFromCkan(userApiKey, userId) {
    return new Promise((resolve, reject) => {
        try {
            logger.debug('Obteniendo detalles usuario');
            var httpRequestOptions = {
                url: constants.CKAN_API_BASE_URL + constants.CKAN_URL_PATH_USER_SHOW + '?id=' + userId,
                method: constants.HTTP_REQUEST_METHOD_GET,
                json: true,
                headers: {
                    'Content-Type': constants.HTTP_REQUEST_HEADER_CONTENT_TYPE_JSON,
                    'User-Agent': constants.HTTP_REQUEST_HEADER_USER_AGENT_NODE_SERVER_REQUEST,
                    'Authorization': userApiKey
                }
            };
            request(httpRequestOptions, function (err, res, body) {
                if (err) {
                    reject(err);
                }
                if (res) {
                    if (res.statusCode == 200) {
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

var getUserOrganizations = function getUserOrganizations(userApiKey) {
    return new Promise((resolve, reject) => {
        try {
            logger.debug('Obteniendo organizaciones');
            var httpRequestOptions = {
                url: constants.CKAN_API_BASE_URL + constants.CKAN_URL_PATH_ORGANIZATION_LIST_OF_USER + '?permission=manage_group',
                method: constants.HTTP_REQUEST_METHOD_GET,
                headers: {
                    'Authorization': userApiKey
                }
            };
            request(httpRequestOptions, function (err, res, body) {
                if (err) {
                    reject(err);
                }
                if (res) {
                    if (res.statusCode == 200) {
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

var insertUserInCkan = function insertUserInCkan(userApiKey, user) {
    return new Promise((resolve, reject) => {
        try {
            logger.info('Insertando usuario en CKAN');
            //Mandatory fields
            var create_user_post_data = {
                'name': user.name,
                'email': user.email,
                'password': user.password
            };
            //Optional fields
            if (user.fullname != '') {
                create_user_post_data.fullname = user.fullname;
            }
            if (user.description != '') {
                create_user_post_data.about = user.description;
            }

            var httpRequestOptions = {
                url: constants.CKAN_API_BASE_URL + constants.CKAN_URL_PATH_USER_CREATE,
                method: constants.HTTP_REQUEST_METHOD_POST,
                body: create_user_post_data,
                json: true,
                headers: {
                    'Content-Type': constants.HTTP_REQUEST_HEADER_CONTENT_TYPE_JSON,
                    'User-Agent': constants.HTTP_REQUEST_HEADER_USER_AGENT_NODE_SERVER_REQUEST,
                    'Authorization': userApiKey
                }
            };

            request(httpRequestOptions, function (err, res, body) {
                if (err) {
                    reject(err);
                }
                if (res) {
                    if (res.body.success) {
                        resolve(res.body);
                    } else {
                        reject(JSON.stringify(res.statusCode) + ' - ' + JSON.stringify(res.statusMessage));
                    }
                } else {
                    reject('Respuesta nula');
                }
            });
        } catch (error) {
            console.log(error);
            logger.error('Error insertando usuario en CKAN:', error);
            reject(error);
        }
    });
}

var insertUserInManager = function insertUserInManager(user, insertCkanResponse) {
    return new Promise((resolve, reject) => {
        try {
            var apikey = insertCkanResponse.apikey;
            var password = user.password = SHA256(user.password).toString(CryptoJS.enc.Base64);
            var userRole = user.role;
            var fullname = user.fullname != null ? user.fullname : '';
            var createdUserId = null;

            pool.connect((connError, client, done) => {
                if (connError) {
                    logger.error('Error en transacción', transactionRollbackError.stack);
                    client.query('ROLLBACK', (rollbackError) => {
                        if (rollbackError) {
                            logger.error('Error en transacción', rollbackError.stack);
                        }
                    })
                }
                logger.notice('Se inicia la transacción de alta de usuario en base de datos AOD_MANAGER');

                const insertUserQuery = {
                    text: dbQueries.DB_ADMIN_INSERT_USER,
                    values: [user.name, password, user.email, true, user.description, fullname]
                };

                client.query(insertUserQuery, (insertUserQueryError, insertUserQueryResponse) => {
                    if (insertUserQueryError) {
                        reject(insertUserQueryError);
                    } else {
                        logger.notice('Se proceden a insertar los permisos del usuario');

                        const insertPermissionsQuery = {
                            text: dbQueries.DB_ADMIN_INSERT_USER_APP_PERMISSION,
                            values: [insertUserQueryResponse.rows[0].id, 'CKAN', apikey]
                        };
                        client.query(insertPermissionsQuery, (insertPermissionsQueryError, insertPermissionsQueryResponse) => {
                            if (insertPermissionsQueryError) {
                                reject(insertPermissionsQueryError);
                            } else {
                                logger.notice('Se procede a asignar al usuario con el rol: ' + userRole);
                                const insertUserRoleQuery = {
                                    text: dbQueries.DB_ADMIN_INSERT_USERS_ROLES,
                                    values: [insertPermissionsQueryResponse.rows[0].id_user, userRole]
                                };
                                client.query(insertUserRoleQuery, (insertUserRoleQueryError, insertUserRoleQueryResponse) => {
                                    if (insertUserRoleQueryError) {
                                        reject(insertUserRoleQueryError);
                                    } else {
                                        logger.notice('Role del usuario insertado');
                                        client.query('COMMIT', (commitError) => {
                                            done();
                                            if (commitError) {
                                                reject(commitError);
                                            } else {
                                                logger.notice('Transacción completada para el usuario: ' + insertUserRoleQueryResponse.rows[0].id_user);
                                                resolve(insertUserRoleQueryResponse.rows[0].id_user);
                                            }
                                        });
                                    }
                                })

                            }
                        })

                    }
                })
            });
        } catch (error) {
            logger.error('Error insertando usuario en base de datos:', error);
            reject(error);
        }
    });
}

var getCkanGroups = function getCkanGroups(userApiKey) {
    return new Promise((resolve, reject) => {
        try {
            logger.info('Obteniendo grupos de CKAN');
            var httpRequestOptions = {
                url: constants.CKAN_API_BASE_URL + constants.CKAN_URL_PATH_GROUP_LIST,
                method: constants.HTTP_REQUEST_METHOD_GET,
                json: true,
                headers: {
                    'Content-Type': constants.HTTP_REQUEST_HEADER_CONTENT_TYPE_JSON,
                    'User-Agent': constants.HTTP_REQUEST_HEADER_USER_AGENT_NODE_SERVER_REQUEST,
                    'Authorization': userApiKey
                }
            };
            request(httpRequestOptions, function (err, res, body) {
                if (err) {
                    reject(err);
                }
                if (res) {
                    if (res.body.success) {
                        resolve(res.body.result);
                    } else {
                        reject(JSON.stringify(res.statusCode) + ' - ' + JSON.stringify(res.statusMessage));
                    }
                } else {
                    reject('Respuesta nula');
                }
            });
        } catch (error) {
            console.log(error);
            logger.error('Error obteniendo grupos de CKAN:', error);
            reject(error);
        }
    });
}
var setOrganizationToUser = function setOrganizationToUser(apiKey, user, userOrganization) {
    return new Promise((resolve, reject) => {
        try {
            let userRole = '';

            if (user.role == 2 || user.role == 1) {
                userRole = 'admin'
            }
            if (user.role == 3) {
                userRole = 'editor'
            }
            if (user.role == 4) {
                userRole = 'member'
            }
                //Mandatory fields
                var create_group_post_data = {
                    'id': userOrganization,
                    'username': user.name,
                    'role': userRole
                };

                var httpRequestOptions = {
                    url: constants.CKAN_API_BASE_URL + constants.CKAN_URL_PATH_ORGANIZATION_MEMBER_CREATE,
                    method: constants.HTTP_REQUEST_METHOD_POST,
                    body: create_group_post_data,
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
        } catch (error) {
            logger.error('Error insertando usuario en los grupos de CKAN:', error);
            reject(error);
        }
    });
}

var deleteOrganizationOfUser = function deleteOrganizationOfUser(apiKey, user, userOrganization) {
    return new Promise((resolve, reject) => {
        try {
            
                //Mandatory fields
                var delete_group_post_data = {
                    'id': userOrganization,
                    'username': user.name
                };

                var httpRequestOptions = {
                    url: constants.CKAN_API_BASE_URL + constants.CKAN_URL_PATH_ORGANIZATION_MEMBER_DELETE,
                    method: constants.HTTP_REQUEST_METHOD_POST,
                    body: delete_group_post_data,
                    json: true,
                    headers: {
                        'Content-Type': constants.HTTP_REQUEST_HEADER_CONTENT_TYPE_JSON,
                        'User-Agent': constants.HTTP_REQUEST_HEADER_USER_AGENT_NODE_SERVER_REQUEST,
                        'Authorization': apiKey
                    }
                };
                logger.info('Configuración llamada POST: ' + JSON.stringify(httpRequestOptions));
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
        } catch (error) {
            logger.error('Error insertando usuario en los grupos de CKAN:', error);
            reject(error);
        }
    });
}

var setGroupsToUser = function setGroupsToUser(userApiKey, user, groups) {
    return new Promise((resolve, reject) => {
        try {
            for (var i = 0; i < groups.length; i++) {
                //Mandatory fields
                var create_group_post_data = {
                    'id': groups[i],
                    'username': user.name,
                    'role': 'admin'
                };

                var httpRequestOptions = {
                    url: constants.CKAN_API_BASE_URL + constants.CKAN_URL_PATH_GROUP_MEMBER_CREATE,
                    method: constants.HTTP_REQUEST_METHOD_POST,
                    body: create_group_post_data,
                    json: true,
                    headers: {
                        'Content-Type': constants.HTTP_REQUEST_HEADER_CONTENT_TYPE_JSON,
                        'User-Agent': constants.HTTP_REQUEST_HEADER_USER_AGENT_NODE_SERVER_REQUEST,
                        'Authorization': userApiKey
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
        } catch (error) {
            logger.error('Error insertando usuario en los grupos de CKAN:', error);
            reject(error);
        }
    });
}

var updateUserInCkan = function updateUserInCkan(userApiKey, userInCkan, user) {
    return new Promise((resolve, reject) => {
        try {
            logger.debug('Actualizando usuario en CKAN');
            let user = userInCkan.result;
            var httpRequestOptions = {
                url: constants.CKAN_API_BASE_URL + constants.CKAN_URL_PATH_USER_UPDATE,
                method: constants.HTTP_REQUEST_METHOD_POST,
                body: user,
                json: true,
                headers: {
                    'Content-Type': constants.HTTP_REQUEST_HEADER_CONTENT_TYPE_JSON,
                    'User-Agent': constants.HTTP_REQUEST_HEADER_USER_AGENT_NODE_SERVER_REQUEST,
                    'Authorization': userApiKey
                }
            };
            logger.info('Configuraćión llamada POST: ' + JSON.stringify(httpRequestOptions));
            request(httpRequestOptions, function (err, res, body) {
                if (err) {
                    reject(err);
                }
                if (res) {
                    if (res.statusCode == 200) {
                        logger.debug('Actualizado usuario en CKAN');
                        if (body.success) {
                            resolve(body.result)
                        }
                    } else {
                        reject(JSON.stringify(res.statusCode) + ' - ' + JSON.stringify(res.statusMessage));
                    }
                } else {
                    reject('Respuesta nula');
                }
            });
        } catch (error) {
            logger.error('Error insertando usuario en CKAN:', error);
            reject(error);
        }
    });
}

var updateUserInManager = function updateUserInManager(user, insertCkanResponse) {
    return new Promise((resolve, reject) => {
        try {
            var apikey = insertCkanResponse.apikey;
            var name = user.name != null ? user.name : '';
            var fullname = user.fullname != null ? user.fullname : '';
            var email = user.email != null ? user.email : '';
            var description = user.description != null ? user.description : '';
            var active = user.active != null ? user.active : false;
            var userId = user.id;
            var userRole = user.role;

            pool.connect((connError, client, done) => {
                if (connError) {
                    logger.error('Error en transacción', transactionRollbackError.stack);
                    client.query('ROLLBACK', (rollbackError) => {
                        if (rollbackError) {
                            logger.error('Error en transacción', rollbackError.stack);
                        }
                    })
                }
                logger.notice('Se inicia la transacción de actualización de usuario en base de datos AOD_MANAGER');

                const updateUserQuery = {
                    text: dbQueries.DB_ADMIN_UPDATE_USER,
                    values: [name, fullname, email, description, active, userId]
                };

                client.query(updateUserQuery, (updateUserQueryError, updateUserQueryResponse) => {
                    if (updateUserQueryError) {
                        reject(updateUserQueryError);
                    } else {
                        logger.notice('Se procede a actualizar el rol del usuario');
                        const insertUserRoleQuery = {
                            text: dbQueries.DB_ADMIN_UPDATE_USER_ROLES,
                            values: [userRole, userId]
                        };
                        client.query(insertUserRoleQuery, (insertUserRoleQueryError, insertUserRoleQueryResponse) => {
                            if (insertUserRoleQueryError) {
                                reject(insertUserRoleQueryError);
                            } else {
                                logger.notice('Role del usuario insertado');
                                client.query('COMMIT', (commitError) => {
                                    done()
                                    if (commitError) {
                                        reject(commitError);
                                    } else {
                                        logger.notice('Actualización del usuario completada ');
                                        resolve(true);
                                    }
                                });
                            }
                        })

                    }
                })
            });
        } catch (error) {
            logger.error('Error borrando usuario en CKAN:', error);
            reject(error);
        }
    });
}

var deleteUserInCkan = function deleteUserInCkan(userApiKey, user) {
    return new Promise((resolve, reject) => {
        try {
            logger.debug('Borrando usuario en CKAN');
            //Mandatory fields
            var delete_user_post_data = {
                'id': user
            };
            
            var httpRequestOptions = {
                url: constants.CKAN_API_BASE_URL + constants.CKAN_URL_PATH_USER_DELETE,
                method: constants.HTTP_REQUEST_METHOD_POST,
                body: delete_user_post_data,
                json: true,
                headers: {
                    'Content-Type': constants.HTTP_REQUEST_HEADER_CONTENT_TYPE_JSON,
                    'User-Agent': constants.HTTP_REQUEST_HEADER_USER_AGENT_NODE_SERVER_REQUEST,
                    'Authorization': userApiKey
                }
            };
            logger.info('Configuraćión llamada POST: ' + JSON.stringify(httpRequestOptions));
            request(httpRequestOptions, function (err, res, body) {
                if (err) {
                    reject(err);
                }
                if (res) {
                    if (res.body.success) {
                        logger.debug('Borrado usuario en CKAN');
                        resolve(res.body)
                        
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

var deleteUserInManager = function deleteUserInManager(user) {
    return new Promise((resolve, reject) => {
        try {
            var id = user;
            pool.connect((connError, client, done) => {
                if (connError) {
                    logger.error('Error en transacción', transactionRollbackError.stack);
                    client.query('ROLLBACK', (rollbackError) => {
                        if (rollbackError) {
                            logger.error('Error en transacción', rollbackError.stack);
                        }
                    })
                }
                logger.notice('Se inicia la transacción de borrado de usuario en base de datos AOD_MANAGER');

                const deleteUserRolesQuery = {
                    text: dbQueries.DB_ADMIN_DELETE_USERS_ROLES,
                    values: [id]
                };
                logger.notice('Se inicia la transacción de borrado de roles');
                client.query(deleteUserRolesQuery, (deleteUserRolesQueryError, deleteUserRolesQueryResponse) => {
                    if (deleteUserRolesQueryError) {
                        reject(deleteUserRolesQueryError);
                    } else {
                        const deleteUserPermissionQuery = {
                            text: dbQueries.DB_ADMIN_DELETE_USER_APP_PERMISSION,
                            values: [id]
                        };
                        client.query(deleteUserPermissionQuery, (deleteUserPermissionQueryError, deleteUserPermissionQueryResponse) => {
                            if (deleteUserPermissionQueryError) {
                                reject(deleteUserPermissionQueryError);
                            } else {
                                const deleteUserQuery = {
                                    text: dbQueries.DB_ADMIN_DELETE_USER,
                                    values: [id]
                                };
                                client.query(deleteUserQuery, (deleteUserQueryError, deleteUserQueryResponse) => {
                                    if (deleteUserQueryError) {
                                        reject(deleteUserQueryError);
                                    } else {
                                        logger.notice('Borrado de usuario realizado con exito.');
                                        resolve(true);
                                    }
                                });
                            }
                        });
                    }
                });
            });
        } catch (error) {
            logger.error('Error borrando usuario en base de datos:', error);
            reject(error);
        }
    });
}

module.exports = router;