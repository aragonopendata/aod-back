//region Libraries
const express = require('express');
const router = express.Router();
const constants = require('../../util/constants');
const dbQueries = require('../../db/db-queries');
const focus = require('../../util/focus');


// FormData for send form-data
const format = require('pg-format');

//DB SETTINGS
const db = require('../../db/db-connection');
const pool = db.getPool();
//LOG SETTINGS
const logConfig = require('../../conf/log-conf');
const loggerSettings = logConfig.getLogSettings();
const logger = require('js-logging').dailyFile([loggerSettings]);

//Load enums
const statesEnum =  constants.statesEnum;

/**
 * GET HISTORY BY ID ROUTE (PUBLIC)
 */
router.get(constants.API_URL_FOCUS_HISTORY + "/:id" , function (req, response, next) {
    
    var id = req.params.id;

    getHistoryById(id).then(fullHistory => {
        response.json({
            'status': constants.REQUEST_REQUEST_OK,
            'success': true,
            'result': 'DETALLE DE UNA HISTORIA POR ID- Historia obtenida correctamente',
            'history': fullHistory
        });
    }).catch(error => {
        logger.error('DETALLE DE UNA HISTORIA POR ID - Error al obtener la historia en base de datos: ', error);
        response.json({ 
            'status': constants.REQUEST_ERROR_INTERNAL_ERROR, 
            'error': 'DETALLE DE UNA HISTORIA POR ID - Error al obtener la historia en base de datos' ,
        });
        return;
    });

});

/**
 * GET HISTORY BY ID ROUTE (PUBLIC)
 */
router.get(constants.API_URL_FOCUS_HISTORY_URL + "/:url" , function (req, response, next) {
    
    var url = req.params.url;
    getHistoryByUrl(url).then(fullHistory => {

        if(fullHistory){
            response.json({
                'status': constants.REQUEST_REQUEST_OK,
                'success': true,
                'result': 'DETALLE DE UNA HISTORIA POR URL- Historia obtenida correctamente',
                'history': fullHistory
            });
        }else{
            response.json({
                'status': constants.REQUEST_NOT_FOUND,
                'success': false,
                'result': 'DETALLE DE UNA HISTORIA POR URL- Historia no encontrada'
            });
        }
        
    }).catch(error => {
        logger.error('DETALLE DE UNA HISTORIA POR URL - Error al obtener la historia en base de datos: ', error);
        response.json({ 
            'status': constants.REQUEST_ERROR_INTERNAL_ERROR, 
            'error': 'DETALLE DE UNA HISTORIA POR URL - Error al obtener la historia en base de datos' ,
        });
        return;
    });

});

/**
 * GET HISTORY BY TOKEN ROUTE (ONLY FOR THE USER WHO KNOW TOKEN)
 */
router.get(constants.API_URL_FOCUS_HISTORY_TOKEN + "/:token" , function (req, response, next) {
    
    var token = req.params.token;

    getHistoryByToken(token).then(fullHistory => {
        response.json({
            'status': constants.REQUEST_REQUEST_OK,
            'success': true,
            'result': 'DETALLE DE UNA HISTORIA POR TOKEN- Historia obtenida correctamente',
            'history': fullHistory
        });
    }).catch(error => {
        logger.error('DETALLE DE UNA HISTORIA POR TOKEN - Error al obtener la historia en base de datos: ', error);
        response.json({ 
            'status': constants.REQUEST_ERROR_INTERNAL_ERROR, 
            'error': 'DETALLE DE UNA HISTORIA POR TOKEN - Error al obtener la historia en base de datos' ,
        });
        return;
    });

});

/**
 * GET STATE HISTORY BY TOKEN ROUTE (ONLY FOR THE USER WHO KNOW TOKEN)
 */
router.get(constants.API_URL_FOCUS_STATE_HISTORY_TOKEN + "/:token" , function (req, response, next) {
    
    var token = req.params.token;

    getStateHistoryByToken(token).then(state => {
        response.json({
            'status': constants.REQUEST_REQUEST_OK,
            'success': true,
            'result': 'DETALLE DE UNA HISTORIA POR TOKEN- Historia obtenida correctamente',
            'state': state
        });
    }).catch(error => {
        logger.error('DETALLE DE UNA HISTORIA POR TOKEN - Error al obtener la historia en base de datos: ', error);
        response.json({ 
            'status': constants.REQUEST_ERROR_INTERNAL_ERROR, 
            'error': 'DETALLE DE UNA HISTORIA POR TOKEN - Error al obtener la historia en base de datos' ,
        });
        return;
    });

});

/**
 * GET RESUMES OF PUBLICS HISTORIES BY STATE "PUBLICADA", BY SEARCH AND BY CATEGORIE (WITHOUT CONTENTS)
 */
router.get(constants.API_URL_FOCUS_HISTORIES, function (req, response, next) {

    getAllPublicsHistories(req.query.text, req.query.category).then(resumeHistories => {
        response.json({
            'status': constants.REQUEST_REQUEST_OK,
            'success': true,
            'result': 'LISTADO DE HISTORIAS - Detalles de historias obtenida correctamente',
            'history': resumeHistories
        });
    }).catch(error => {
        logger.error( 'LISTADO DE HISTORIAS - Error al obtener las historias de la base de datos:' , error);
        response.json({ 
            'status': constants.REQUEST_ERROR_INTERNAL_ERROR, 
            'error':  'LISTADO DE HISTORIAS - Error al obtener las historias de la base de datos'  ,
        });
        return;
    });

});

/**
 * GET IMAGE BY ID CATEGORY
 */
router.get(constants.API_URL_FOCUS_IMAGE_CATEGORY + "/:category_id" , function (req, response, next) {
    
    var category_id = req.params.category_id;


    getImageCategory(category_id).then(image => {
        response.json({
            'status': constants.REQUEST_REQUEST_OK,
            'success': true,
            'result': 'DETALLE DE UNA IMAGEN POR ID DE LA CATEGORIA- Imagen obtenida correctamente',
            'image': image
        });
    }).catch(error => {
        logger.error('DETALLE DE UNA IMAGEN POR ID DE LA CATEGORIA - Error al obtener la imagen en base de datos: ', error);
        response.json({ 
            'status': constants.REQUEST_ERROR_INTERNAL_ERROR, 
            'error': 'DETALLE DE UNA IMAGEN POR ID DE LA CATEGORIA - Error al obtener la imagen en base de datos' ,
        });
        return;
    });

});


/**
 * CREATE NEW HISTORY
 */
router.put(constants.API_URL_FOCUS_HISTORY, function (req, response, next) {
    
    var history = req.body;

    if ( !history || !history.title ){
        logger.error('Input Error', 'Incorrect input');
        response.json({ 'status': constants.REQUEST_ERROR_BAD_DATA, error: 'Incorrect Input' });
        return;
    }

    inserHistoryTransaction(history).then(historyInfo => {

        logger.info('CREACIÓN DE UNA HISTORIA - Historia creada correctamente')
        response.json({
            'status': constants.REQUEST_REQUEST_OK,
            'success': true,
            'result': 'CREACION DE UNA HISTORIA COMPLETA - Historia creada correctamente',
            'id': historyInfo.id,
            'token': historyInfo.token,
        });
        
    }).catch(error => {
        logger.error('CREACIÓN DE UNA HISTORIA - Error al crear la historia en base de datos : ', error);
        response.json({ 
            'status': constants.REQUEST_ERROR_INTERNAL_ERROR, 
            'error': 'CREACIÓN DE UNA HISTORIA - Error al crear la historia en base de datos' ,
        });
        return;
    });
});


/**
 * UPDATE HISTORY
 */
router.post(constants.API_URL_FOCUS_HISTORY, function (req, response, next) {
    
    var history = req.body;

    if ( !history || !history.title ){
        logger.error('Input Error', 'Incorrect input');
        res.json({ 'status': constants.REQUEST_ERROR_BAD_DATA, error: 'Incorrect Input' });
        return;
    }

    updateHistoryTransaction(history).then(historyInfo => {
        response.json({
            'status': constants.REQUEST_REQUEST_OK,
            'success': true,
            'result': 'ACTUALIZACIÓN DE UNA HISTORIA - Historia actualizada correctamente',
            'id': historyInfo.id,
            'token': historyInfo.token
        });
        
    }).catch(error => {
        logger.error('ACTUALIZACIÓN DE UNA HISTORIA - Error al actualizar la historia en base de datos: ', error);
        response.json({ 
            'status': constants.REQUEST_ERROR_INTERNAL_ERROR, 
            'error': 'ACTUALIZACIÓN DE UNA HISTORIA - Error al actualizar la historia en base de datos' ,
        });
        return;
    });
});


/**
 * UPDATE MAIL OF AN HISTORY BY TOKEN AND BY AN USER
 */
router.post(constants.API_URL_FOCUS_HISTORY_MAIL, function (req, response, next) {
    var history = req.body;

    updateMailHistoryTransaction(history).then( () => {
        response.json({
            'status': constants.REQUEST_REQUEST_OK,
            'success': true,
            'result': 'ACTUALIZAR EMAIL DE LA HISTORIA - Email actualizado correctamente',
            'history': history.id
        });
    }).catch(error => {
        logger.error('ACTUALIZAR EMAIL DE LA HISTORIA  - Error alal actualizar el mail en base de datos: ', error);
        response.json({ 
            'status': constants.REQUEST_ERROR_INTERNAL_ERROR, 
            'error': 'ACTUALIZAR EMAIL DE LA HISTORIA  - Error alal actualizar el mail en base de datos' ,
        });
        return;
    });
});




function getHistoryById(id){
    return new Promise((resolve, reject) => {
        try {
            getStateHistoryById(id).then ((state)=> {
                if(state==statesEnum.publicada){
                    focus.getHistoryById(id).then( (historySelect) => {
                        //quitamos email y token (info no necesaria para un usuario)
                        historySelect.email=null
                        historySelect.token=null
                        resolve(historySelect);
                    }).catch(error => {
                        logger.error('getHistoryById - Error obteniendo la historia:', error);
                        reject(error);
                    });
                }else{
                    logger.error('getHistoryById - No se permite ver la historia por id a no estar publicada:');
                    reject('getHistoryById - No se permite ver la historia por id a no estar publicada');
                }
            }).catch(error => {
                logger.error('getHistoryById - Error obteniendo el estado de la historia:', error);
                reject(error);
            });   
        } catch (error) {
            logger.error('getHistoryById - Error obteniendo la historia:', error);
            reject(error);
        }
    });
}

function getHistoryByUrl(url){
    return new Promise((resolve, reject) => {
        try {
            getStateHistoryByUrl(url).then ((state)=> {
                if(state==statesEnum.publicada){
                    focus.getHistoryByUrl(url).then( (historySelect) => {
                        //quitamos email y token (info no necesaria para un usuario)
                        historySelect.email=null
                        historySelect.token=null
                        resolve(historySelect);
                    }).catch(error => {
                        logger.error('getHistoryByUrl - Error obteniendo la historia:', error);
                        reject(error);
                    });
                }else{
                    logger.error('getHistoryByUrl - no exite la historia');
                    resolve(null)
                }
            }).catch(error => {
                logger.error('getHistoryByUrl - Error obteniendo el estado de la historia:', error);
                reject(error);
            });   
        } catch (error) {
            logger.error('getHistoryByUrl - Error obteniendo la historia:', error);
            reject(error);
        }
    });
}

function getHistoryByToken(token){

    return new Promise((resolve, reject) => {
        try {
            getStateHistoryByToken(token).then ((state)=> {

                if(state==statesEnum.borrador || state==statesEnum.publicada){
                    focus.getHistoryByToken(token).then( (historySelect) => {
                        //quitamos email (info no necesaria para un usuario)
                        historySelect.email=null
                        //historySelect.token=null
                        resolve(historySelect);
                    }).catch(error => {
                        logger.error('getHistoryByToken - Error obteniendo la historia:', error);
                        reject(error);
                    });
                }else{
                    logger.error('getHistoryByToken - No se permite ver la historia por token al no presentar estado editable');
                    reject('getHistoryByToken - No se permite ver la historia por token al no presentar estado editable');
                }
            }).catch(error => {
                logger.error('getHistoryByToken - Error obteniendo el estado de la historia:', error);
                reject(error);
            });   
        } catch (error) {
            logger.error('getHistoryByToken - Error obteniendo la historia:', error);
            reject(error);
        }
    });
}

function getStateHistoryByToken(token){

    return new Promise((resolve, reject) => {
        try {
            pool.connect((err, client, done) => {

                if(err){
                    logger.error('getStateHistoryByToken - No se puede establecer conexión con la BBDD');
                    reject(err)
                    return
                }

                var queryStateHistory = {
                    text: dbQueries.DB_FOCUS_GET_STATE_HISTORY_BY_TOKEN,
                    values: [token],
                    rowMode: constants.SQL_RESULSET_FORMAT_JSON
                }


                //Se busca la historia introducida como parámetro en la tabla histories
                pool.query(queryStateHistory, (err, result) => {
                    done();
                    if (err) {
                        logger.error('getStateHistoryByToken - Error obteniendo el estado de la historia:',err.stack);
                        reject(err);
                    } else {

                        if(result.rows.length == 0){
                            logger.error('getDetailHistoriesInCampus - Error obteniendo la historia del token al no existir la misma');
                            reject('getDetailHistoriesInCampus - Error obteniendo la historia del token al no existir la misma');
                        }else{
                            logger.notice('getStateHistoryByToken - Obtención del estado de una historia')
                            resolve(result.rows[0].state);
                        }
                    }
                });

            });
        } catch (error) {
            logger.error('getDetailHistoriesInCampus - Error obteniendo el detalle de historias:', error);
            reject(error);
        }
    });
}

function getStateHistoryById(id){

    return new Promise((resolve, reject) => {
        try {
            pool.connect((err, client, done) => {

                if(err){
                    logger.error('getStateHistoryByToken - No se puede establecer conexión con la BBDD');
                    reject(err)
                    return
                }

                var queryStateHistory = {
                    text: dbQueries.DB_FOCUS_GET_STATE_HISTORY_BY_ID,
                    values: [id],
                    rowMode: constants.SQL_RESULSET_FORMAT_JSON
                }



                //Se busca la historia introducida como parámetro en la tabla histories
                pool.query(queryStateHistory, (err, result) => {
                    done();
                    if (err) {
                        logger.error('getStateHistoryByToken - Error obteniendo el estado de la historia:',err.stack);
                        reject(err);
                    } else {
                        if(result.rows.length == 0){
                            logger.error('getDetailHistoriesInCampus - Error obteniendo la historia del token al no existir la misma');
                            reject('getDetailHistoriesInCampus - Error obteniendo la historia del token al no existir la misma');
                        }else{
                            logger.notice('getStateHistoryByToken - Obtención del estado de una historia')
                            resolve(result.rows[0].state);
                        }
                    }
                });

            });
        } catch (error) {
            logger.error('getDetailHistoriesInCampus - Error obteniendo el detalle de historias:', error);
            reject(error);
        }
    });
}

function getStateHistoryByUrl(url){

    return new Promise((resolve, reject) => {
        try {
            pool.connect((err, client, done) => {

                if(err){
                    logger.error('getStateHistoryByUrl - No se puede establecer conexión con la BBDD');
                    reject(err)
                    return
                }

                var queryStateHistory = {
                    text: dbQueries.DB_FOCUS_GET_STATE_HISTORY_BY_URL,
                    values: [url],
                    rowMode: constants.SQL_RESULSET_FORMAT_JSON
                }

                //Se busca la historia introducida como parámetro en la tabla histories
                pool.query(queryStateHistory, (err, result) => {
                    done();
                    if (err) {
                        logger.error('getStateHistoryByUrl - Error obteniendo el estado de la historia:',err.stack);
                        reject(err);
                    } else {
                        if(result.rows.length == 0){
                            logger.notice('getStateHistoryByUrl - la historia no existe');
                            resolve(null)
                        }else{
                            logger.notice('getStateHistoryByUrl - Obtención del estado de una historia')
                            resolve(result.rows[0].state);
                        }
                    }
                });

            });
        } catch (error) {
            logger.error('getStateHistoryByUrl - Error obteniendo el detalle de historias:', error);
            reject(error);
        }
    });
}

function getAllPublicsHistories(text, category){

    return new Promise((resolve, reject) => {
        try {
	    pool.connect((err, client, done) => {

                if(err){
	            logger.error(err);
                    logger.error('getAllPublicsHistories - No se puede establecer conexión con la BBDD');
                    reject(err)
                    return
                }

                var queryHistories="";

                var search="%"+ text + "%";

                if(category==null){
                    queryHistories = {
                        text: dbQueries.DB_FOCUS_GET_HISTORIES_USER_BY_STATE_AND_SEARCH,
                        values: [statesEnum.publicada, search],
                        rowMode: constants.SQL_RESULSET_FORMAT_JSON
                    }
                }else{
                    queryHistories = {
                        text: dbQueries.DB_FOCUS_GET_HISTORIES_USER_BY_STATE_AND_SEARCH_AND_CATEGORY,
                        values: [statesEnum.publicada, search, category],
                        rowMode: constants.SQL_RESULSET_FORMAT_JSON
                    }
                }

                //Se busca la historia introducida como parámetro en la tabla histories
                pool.query(queryHistories, (err, result) => {
                    done();
                    if (err) {
                        logger.error('getAllPublicsHistories - Error obteniendo los detalles de historias:',err.stack);
                        reject(err);
                    } else {
                        logger.notice('getAllPublicsHistories - Obtención de detalles de historias finalizada')
                        var resumeHistories=result.rows;
                        resolve(resumeHistories);
                    }
                });

            });
        } catch (error) {
            logger.error('getDetailHistoriesInCampus - Error obteniendo el detalle de historias:', error);
            reject(error);
        }
    });

}


function updateMailHistoryTransaction(history){

    return new Promise((resolve, reject) => {
        try {
            pool.connect((err, client, done) => {

                if(err){
                    logger.error('updateMailHistoryTransaction - No se puede establecer conexión con la BBDD');
                    reject(err)
                    return
                }

                const queryUpdateHistory = {
                    text: dbQueries.DB_FOCUS_UPDATE_MAIL_HISTORIES_USER,
                    values: [history.email, history.id]
                };

                //Se busca actuliza el mail
                pool.query(queryUpdateHistory, (err, result) => {
                    done();
                    if (err) {
                        logger.error('updateMailHistoryTransaction - Error actualizando mail de historias:',err.stack);
                        reject(err);
                    } else {
                        logger.notice('updateMailHistoryTransaction - Actualización de mail finalizada')
                        var resumeHistories=result.rows;
                        resolve(resumeHistories);
                    }
                });
            });
        } catch (error) {
            logger.error('updateMailHistoryTransaction - Error obteniendo el detalle de historias:', error);
            reject(error);
        }
    });

}



function getMailHistoryTransaction(history){

    return new Promise((resolve, reject) => {
        try {
            pool.connect((err, client, done) => {

                if(err){
                    logger.error('updateMailHistoryTransaction - No se puede establecer conexión con la BBDD');
                    reject(err)
                    return
                }

                const queryGetMailHistory = {
                    text: dbQueries.DB_FOCUS_GET_MAIL_HISTORIES_USER,
                    values: [history.id]
                };


                //Se busca actuliza el mail
                pool.query(queryGetMailHistory, (err, result) => {
                    done();
                    if (err) {
                        logger.error('updateMailHistoryTransaction - Error actualizando mail de historias:',err.stack);
                        reject(err);
                    } else {
                        logger.notice('updateMailHistoryTransaction - Actualización de mail finalizada')
                        var resumeHistories=result.rows;
                        resolve(resumeHistories);
                    }
                });
            });
        } catch (error) {
            logger.error('updateMailHistoryTransaction - Error obteniendo el detalle de historias:', error);
            reject(error);
        }
    });

}




function inserHistoryTransaction(history){

    return new Promise((resolve, reject) => {
        try {
            if(history.state==statesEnum.borrador || history.state==statesEnum.revision){
                focus.inserHistoryTransaction(history).then( (infoHistory) => {
                    logger.notice('inserHistoryTransaction - Insercción de  historia finalizada')
                    resolve(infoHistory);
                }).catch(error => {
                    logger.error('inserHistoryTransaction - Error insertando la historia:', error);
                    reject(error);
                });
            }else{
                logger.error('inserHistoryTransaction - Error creando la nueva historia al no tener el estado necesario para hacerlo');
                reject('inserHistoryTransaction - Error creando la nueva historia al no tener el estado necesario para hacerlo');
            }
        } catch (error) {
            logger.error('inserHistoryTransaction - Error creando la nueva historia:', error);
            reject(error);
        }
    });

}

function updateHistoryTransaction(history){
    return new Promise((resolve, reject) => {
        try {            
            if(history.state==statesEnum.borrador || history.state==statesEnum.revision){//quitar rev, solo para admin!

                probeTokenForId(history.token, history.id).then((sameHistory)=>{

                    if(sameHistory){
                        getMailHistoryTransaction(history).then( (mail) => {


                            history.email=mail[0].email;


                            getStateHistoryById(history.id).then( (oldState) => {

                                if((history.id_reference==history.id)&&(history.state==statesEnum.revision)&&(oldState==statesEnum.publicada)){//caso versionado de historia --> cambiar id antigua (actualizando con nueva), y guardado de la nueva 
                                    focus.getHistoryById(history.id).then( (fullHistory) => {
                                        if(fullHistory.state==statesEnum.publicada){
                                            focus.versionHistory(history).then( (infoHistory) => {
                                                resolve(infoHistory);
                                            }).catch(error => {
                                                logger.error('inserHistoryTransaction - Error insertando la historia:', error);
                                                reject(error);
                                            });
                                        }else{
                                            logger.notice('updateHistoryTransaction - La historia no presenta el estado de publicada como se indica en el objeto recibido')
                                            reject('updateHistoryTransaction - La historia no presenta el estado de publicada como se indica en el objeto recibido');        
                                        }
                                    }).catch(error => {
                                        logger.error('updateHistoryTransaction - Error al comprobar la historia versionada:', error);
                                        reject(error);
                                    });
                                }else if(oldState==statesEnum.borrador){
                                    focus.updateHistory(history).then( (infoHistory) => {
                                        resolve(infoHistory);
                                    }).catch(error => {
                                        logger.error('inserHistoryTransaction - Error insertando la historia:', error);
                                        reject(error);
                                    });
                                }else{
                                    logger.notice('updateHistoryTransaction - La historia no presenta una estructura de actualización correcta')
                                    reject('updateHistoryTransaction - La historia no presenta una estructura de actualización correcta');
                                }
                            }).catch(error => {
                                logger.error('updateHistoryTransaction - Error obteniendo estado de antigua historia:', error);
                                reject(error);
                            });

                        }).catch(error => {
                            logger.error('updateHistoryTransaction - Error obteniendo estado de antigua historia:', error);
                            reject(error);
                        });


                    }else{
                        logger.notice('updateHistoryTransaction - La historia no mantiene relación entre id y token')
                        reject('updateHistoryTransaction - La historia no mantiene relación entre id y token');
                    }
                })
                .catch(error => {
                    logger.error('updateHistoryTransaction - Error al comprobar relación token-historia:', error);
                    reject(error);
                });

            }else{
                logger.notice('updateHistoryTransaction - La historia no presenta un estado de actualización correcto')
                reject('updateHistoryTransaction - La historia no presenta un estado de actualización correcto');
            }
        } catch (error) {
            logger.error('updateHistoryTransaction - Error modificando la historia:', error);
            reject(error);
        }
    });
}

function probeTokenForId(token, id){

    return new Promise((resolve, reject) => {

        try {
            pool.connect((err, client, done) => {
                const queryProbeTokenForId = {
                    text: dbQueries.DB_FOCUS_GET_HISTORY_BY_ID,
                    values: [id]
                };
    
                client.query(queryProbeTokenForId, (err, resultUpdateIdVersion) => {    
                    if (rollback(client, done, err)) {    
                        logger.error('probeTokenForId - Error probando la relación id-token:', err);
                        reject(err);
                    } else {
                        if(resultUpdateIdVersion.token==resultUpdateIdVersion.rows.token){    
                            logger.info('probeTokenForId - Comprobación correcta de relación id-token')
                            resolve(true)
                        }else{
                            logger.info('probeTokenForId - Comprobación incorrecta de relación id-token')
                            resolve(false)
                        }
                    }
                })
            });
        } catch (error) { 
            logger.error('probeTokenForId - Error probando la relación id-token:', error);
            reject(error);
        }
    });
}

function getImageCategory(category_id){

    return new Promise((resolve, reject) => {
        try {
            pool.connect((err, client, done) => {

                if(err){
                    logger.error('getImageCategory - No se puede establecer conexión con la BBDD');
                    reject(err)
                    return
                }

                var queryIdCategory = {
                    text: dbQueries.DB_FOCUS_GET_IMAGE_BY_CATEGORY,
                    values: [category_id],
                    rowMode: constants.SQL_RESULSET_FORMAT_JSON
                }


                //Se busca la ruta a la imagen correspondiente a la categoria
                pool.query(queryIdCategory, (err, result) => {
                    done();
                    if (err) {
                        logger.error('getImageCategory - Error obteniendo la imagen correspondiente a la categoria:',err.stack);
                        reject(err);
                    } else {

                        if(result.rows.length == 0){
                            logger.error('getImageCategory - Error obteniendo el id de la categoria al no existir la misma');
                            reject('getImageCategory - Error obteniendo el id de la categoria al no existir la misma');
                        }else{
                            logger.notice('getImageCategory - Obtención de la imagen')
                            resolve(result.rows[0]);
                        }
                    }
                });

            });
        } catch (error) {
            logger.error('getImageCategory - Error obteniendo el detalle de imagenes de una categoria:', error);
            reject(error);
        }
    });
}


function rollback(client, done, err){
    if (err) {
        client.query('ROLLBACK', (err) => {
            if (err) {
                console.error('Error rolling back client', err.stack)
            }
            done();
        })
    }
    return !!err;
}

module.exports = router;
