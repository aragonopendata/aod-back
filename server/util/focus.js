//region Libraries
const constants = require('constants');
const dbQueries = require('../db/db-queries');

//DB SETTINGS
const db = require('../db/db-connection');
const pool = db.getPool();
// FormData for send form-data
const format = require('pg-format');
//LOG SETTINGS
const logConfig = require('../conf/log-conf');
const loggerSettings = logConfig.getLogSettings();
const logger = require('js-logging').dailyFile([loggerSettings]);



//Load enums
const statesEnum =  constants.statesEnum;

module.exports = {
    getHistoryById(id){
    
        return new Promise((resolve, reject) => {
            try {
                pool.connect((err, client, done) => {
    
                    if(err){
                        logger.error('getHistoryById - No se puede establecer conexión con la BBDD');
                        reject(err)
                        return
                    }
    
                    const queryHistory = {
                        text: dbQueries.DB_FOCUS_GET_HISTORY_BY_ID,
                        values: [id]
                    }
        
                    //Se busca la historia introducida como parámetro en la tabla histories
                    pool.query(queryHistory, (err, result) => {
                        if (err) {
                            done();
                            logger.error('getHistoryById - Error obteniendo la historia',err.stack);
                            reject(err);
                        } else {
                            //Si tiene un resultado, obtenemos la historia y la devolvemos
                            if( result.rows.length == 1 ){
                                logger.info('getHistoryById - Id historia recuperada: ' + result.rows[0].id);
                                var historySelect=result.rows[0];
    
                                const queryContent = {
                                    text: dbQueries.DB_FOCUS_GET_CONTENTS_HISTORIES_PARTICULAR_HISTORY,
                                    values: [historySelect.id]
                                }
    
                                //obtenemos los contenidos de la historia
                                pool.query(queryContent, (err, result) => {
                                    done();
                                    if (err) {
                                        logger.error('getHistoryById - Error obteniendo los contenidos de la historia:',err.stack);
                                        reject(err);
                                    } else {
                                        logger.info('getHistoryById - Contenidos recuperados ');
                                        historySelect.contents = result.rows
                                        resolve(historySelect);
                                    }
                                });
                            } else {
                                done();
                                logger.error('getHistoryById - No existe la historia');
                                reject('getHistoryById - No existe la historia');
                            }
                        }
                    });
                });
            } catch (error) {
                logger.error('getHistoryById - Error buscando la historia:', error);
                reject(error);
            }
        });
    },
    getHistoryByUrl(url){
    
        return new Promise((resolve, reject) => {
            try {
                pool.connect((err, client, done) => {
    
                    if(err){
                        logger.error('getHistoryByUrl - No se puede establecer conexión con la BBDD');
                        reject(err)
                        return
                    }
    
                    const queryHistory = {
                        text: dbQueries.DB_FOCUS_GET_HISTORY_BY_URL,
                        values: [url]
                    }
        
                    //Se busca la historia introducida como parámetro en la tabla histories
                    pool.query(queryHistory, (err, result) => {
                        if (err) {
                            done();
                            logger.error('getHistoryByUrl - Error obteniendo la historia',err.stack);
                            reject(err);
                        } else {
                            //Si tiene un resultado, obtenemos la historia y la devolvemos
                            if( result.rows.length == 1 ){
                                logger.info('getHistoryByUrl - Id historia recuperada: ' + result.rows[0].id);
                                var historySelect=result.rows[0];
    
                                const queryContent = {
                                    text: dbQueries.DB_FOCUS_GET_CONTENTS_HISTORIES_PARTICULAR_HISTORY,
                                    values: [historySelect.id]
                                }
    
                                //obtenemos los contenidos de la historia
                                pool.query(queryContent, (err, result) => {
                                    done();
                                    if (err) {
                                        logger.error('getHistoryByUrl - Error obteniendo los contenidos de la historia:',err.stack);
                                        reject(err);
                                    } else {
                                        logger.info('getHistoryByUrl - Contenidos recuperados ');
                                        historySelect.contents = result.rows
                                        resolve(historySelect);
                                    }
                                });
                            } else {
                                done();
                                logger.error('getHistoryByUrl - No existe la historia');
                                reject('getHistoryByUrl - No existe la historia');
                            }
                        }
                    });
                });
            } catch (error) {
                logger.error('getHistoryById - Error buscando la historia:', error);
                reject(error);
            }
        });
    },
    getHistoryByToken(token){
    
        return new Promise((resolve, reject) => {
            try {
                pool.connect((err, client, done) => {
    
                    if(err){
                        logger.error('getHistoryByToken - No se puede establecer conexión con la BBDD');
                        reject(err)
                        return
                    }
    
                    const queryHistory = {
                        text: dbQueries.DB_FOCUS_GET_HISTORY_BY_TOKEN,
                        values: [token]
                    }
    
                    //Se busca la historia introducida como parámetro en la tabla histories
                    pool.query(queryHistory, (err, result) => {
                        if (err) {
                            done();
                            logger.error('getHistoryByToken - Error obteniendo la historia',err.stack);
                            reject(err);
                        } else {
                            //Si tiene un resultado, obtenemos la historia y la devolvemos
                            if( result.rows.length == 1 ){
                                logger.info('getHistoryByToken - Id historia recuperada: ' + result.rows[0].id);
                                var historySelect=result.rows[0];
    
                                const queryContent = {
                                    text: dbQueries.DB_FOCUS_GET_CONTENTS_HISTORIES_PARTICULAR_HISTORY,
                                    values: [historySelect.id]
                                }
        
    
                                //obtenemos los contenidos de la historia
                                pool.query(queryContent, (err, result) => {
                                    done();
                                    if (err) {
                                        logger.error('getHistoryByToken - Error obteniendo los contenidos de la historia:',err.stack);
                                        reject(err);
                                    } else {
                                        logger.info('getHistoryByToken - Contenidos recuperados ');
                                        historySelect.contents = result.rows
                                        resolve(historySelect);
                                    }
                                });
                            } else {
                                done();
                                logger.error('getHistoryByToken - No existe la historia');
                                resolve(null);
                            }
                        }
                    });
                });
            } catch (error) {
                logger.error('getHistoryByToken -  Error buscando la historia por token:', error);
                reject(error);
            }
        });
    },
    inserHistoryTransaction(history){
        return new Promise((resolve, reject) => {
            try{
                pool.connect((err, client, done) => {

                    if(err){
                        logger.error('inserHistoryTransaction - No se puede establecer conexión con la BBDD');
                        reject(err)
                        return
                    }
        
                    newToken().then( (token ) => {
        
                        logger.notice('Se inicia la transacción de insercion de una historia');
        
                        client.query('BEGIN', (err) => {
        
                            if (rollback(client, done, err)) {
                                logger.error('inserHistoryTransaction - Error creando historia:', err);
                                reject(err);
                            } else {

                                inserHistory(client, done, token, history, null).then( (idHistory) => {
                                    client.query('COMMIT', (commitError) => {
                                        done();
                                        if (commitError) {
                                            logger.error('inserHistoryTransaction - Error creando historia:', commitError);
                                            reject(commitError);
                                        } else {
                                            logger.notice('inserHistoryTransaction - Creación de historia finalizada')
                                            var objectInfo=new Object;
                                            objectInfo.id=idHistory;
                                            objectInfo.token=token;
                                            resolve(objectInfo);
                                        }
                                    });
                                }).catch(error => {
                                    logger.error('inserHistoryTransaction - Error insertando la historia:', error);
                                    reject(error);
                                });
                            }
                        });
                    }).catch(error => {
                        logger.error('inserHistoryTransaction - Error generando el token de la historia:', error);
                        reject(error);
                    });
                });

            
            } catch (error) {
                logger.error('getHistoryById - Error buscando la historia:', error);
                reject(error);
            }
        });

        
    },
    versionHistory(history){
        return new Promise((resolve, reject) => {
            try{
                pool.connect((err, client, done) => {
                    client.query('BEGIN', (err) => {
                        if (rollback(client, done, err)) {
                            reject(err);
                        } else {
                            newToken().then( (token ) => {
                                var id = history.id;
                                updateForVersion(client, done, id,token).then( () => {

                                    history.id_reference=id;
                                    inserHistory(client, done, history.token, history,null).then( (idHistory) => {

                                        client.query('COMMIT', (commitError) => {
                                            done();
                                            if (commitError) {
                                                logger.error('updateHistoryTransaction - Error actualizando la historia con versionado:', commitError);
                                                reject(commitError);
                                            } else {
                                                logger.notice('updateHistoryTransaction - modificación de historia con versionado finalizada')
                                                var objectInfo=new Object;
                                                objectInfo.id=idHistory;
                                                objectInfo.token=history.token;
                                                resolve(objectInfo);
                                            }
                                        });
                                    }).catch(error => {
                                        logger.error('updateHistoryTransaction - Error actualizando la historia con versionado:', error);
                                        reject(error);
                                    });
                                    

                                }).catch(error => {
                                    logger.error('updateHistoryTransaction - Error actualizando la historia con versionado:', error);
                                    reject(error);
                                });

                            }).catch(error => {
                                logger.error('updateHistoryTransaction - Error actualizando la historia con versionado:', error);
                                reject(error);
                            });
                            
                        }
                    });
                });
            } catch (error) {
                logger.error('getHistoryById - Error buscando la historia:', error);
                reject(error);
            }
        });

    },
    updateHistory(history){
        return new Promise((resolve, reject) => {
            try{
                pool.connect((err, client, done) => {
                    client.query('BEGIN', (err) => {
    
                        if (rollback(client, done, err)) {
                            reject(err);
                        } else {
                            var token = history.token;
                            var id=history.id;
                            deleteHistory(client, done, id).then( () => {
                                inserHistory(client, done, token, history, id).then( (idHistory) => {
                                    client.query('COMMIT', (commitError) => {
                                        done();
                                        if (commitError) {
                                            logger.error('updateHistoryTransaction - Error modificando la historia:', commitError);
                                            reject(commitError);
                                        } else {
                                            logger.notice('updateHistoryTransaction - modificación de historia finalizada')
                                            var objectInfo=new Object;
                                            objectInfo.id=idHistory;
                                            objectInfo.token=token;
                                            resolve(objectInfo);                                            }
                                    });
                                }).catch(error => {
                                    logger.error('updateHistoryTransaction - Error insertando la historia:', error);
                                    reject(error);
                                });
                            }).catch(error => {
                                logger.error('updateHistoryTransaction - Error eliminando la historia:', error);
                                reject(error);
                            });
                        }
                    });
                });
            } catch (error) {
                logger.error('getHistoryById - Error buscando la historia:', error);
                reject(error);
            }
        });

    },
    deleteHistoryById(idHistory){
        return new Promise((resolve, reject) => {
            try{
                pool.connect((err, client, done) => {
                    client.query('BEGIN', (err) => {
                        if (rollback(client, done, err)) {
                            reject(err);
                        } else {
                            deleteHistory(client, done, idHistory).then( () => {
                                client.query('COMMIT', (commitError) => {
                                    done();
                                    if (commitError) {
                                        logger.error('deleteHistoryById - Error eliminando la historia:', commitError);
                                        reject(idHistory);
                                    } else {
                                        logger.notice('deleteHistoryById - eliminación de historia finalizada')
                                        resolve(idHistory);                                            }
                                });
                            }).catch(error => {
                                logger.error('updateHistoryTransaction - Error eliminando la historia:', error);
                                reject(error);
                            });
                        }
                    });
                });
            } catch (error) {
                logger.error('getHistoryById - Error buscando la historia:', error);
                reject(error);
            }
        });

    },



}


function inserHistory(client, done, token, history, id){

    return new Promise((resolve, reject) => {
        try {
            var queryHistory="";

            if(id==null){
                queryHistory = {
                    text: dbQueries.DB_FOCUS_INSERT_FOCUS_HISTORY,
                    values: [history.url, token, history.state, history.title, history.description, history.email, history.id_reference, history.main_category, history.secondary_categories, history.create_date, history.update_date]
                };
            }else{
                queryHistory = {
                    text: dbQueries.DB_FOCUS_INSERT_FOCUS_HISTORY_WITH_ID,
                    values: [history.url, token, history.state, history.title, history.description, history.email, history.id_reference, history.main_category, history.secondary_categories, history.create_date, history.update_date, id]
                };
            }            
            
            client.query(queryHistory, (err, resultHistory) => {
                if (rollback(client, done, err)) {
                    logger.error('inserHistory - Error guardando historia:', err);
                    reject(err);
                } else {
                    id_history=resultHistory.rows[0].id;
                    url = `${history.url}${id_history}`;                    

                    const queryUpdateUrl = {
                        text: dbQueries.DB_FOCUS_UPDATE_FOCUS_HISTORY_URL,
                        values: [url,id_history]
                    };
        
                    //set url
                    client.query(queryUpdateUrl, (err, resultUpdateUrl) => {
        
                        if (rollback(client, done, err)) {
                            logger.error('setUrl - Error insertando la URL de la historia:', err);
                            reject(err);
                        } else {
                            
                            if(history.contents){
                                let sqlContents =  dbQueries.DB_FOCUS_INSERT_FOCUS_CONTENTS_HISTORY;
                                var valuesContents= (history.contents).map(item => [item.title, item.description, item.type_content, item.visual_content, item.align, id_history, item.body_content, item.order_content])

                                //console.log(format(sqlContents, valuesContents))
                                //console.log(valuesContents)

                                client.query(format(sqlContents, valuesContents), (err, resultContents) => {
                                    if (rollback(client, done, err)) {
                                        logger.error('inserHistory - Error insertando la historia:', err);
                                        reject(err);
                                    } else {
                                        logger.notice('inserHistory - inserción de la historia finalizada');
                                        resolve(resultHistory.rows[0].id);
                                    }
                                });
                            } else {
                                logger.error('inserHistory - Error insertando la historia:', err);
                                resolve(resultHistory.rows[0].id);
                            }
                        }
                    });
                }
            })

        } catch (error) {
            logger.error('Error insertando historia:', error);
            reject(error);
        }
    });

}

function updateForVersion(client, done, idHistory, tokenNewForHistory){

    return new Promise((resolve, reject) => {

        try {

            const queryUpdateForVersion = {
                text: dbQueries.DB_FOCUS_UPDATE_FOCUS_HISTORY_ID_VERSION,
                values: [tokenNewForHistory,idHistory]
            };


            //cambio token antiguo
            client.query(queryUpdateForVersion, (err, resultUpdateIdVersion) => {

                if (rollback(client, done, err)) {
                    logger.error('updateForVersion - Error cambiando id de la historia:', err);
                    reject(err);
                } else {
                    logger.info('updateForVersion - cambio id antigua por nuevo de '+ idHistory + ' al nuevo id '+ tokenNewForHistory)
                    resolve(true)
                }
            })

        } catch (error) {
            logger.error('updateForVersion -  Error cambiando id de la historia:', error);
            reject(error);
        }
    });

}

function deleteHistory(client, done, idHistory){

    return new Promise((resolve, reject) => {

        try {

            const queryDeleteContents = {
                text: dbQueries.DB_ADMIN_DELETE_FOCUS_CONTENT_BY_ID_HISTORY,
                values: [idHistory]
            };

            //borrar contenidos
            client.query(queryDeleteContents, (err, resultDeleteContents) => {

                if (rollback(client, done, err)) {
                    logger.error('deleteHistory - Error eliminado historia:', err);
                    reject(err);
                } else {

                    const queryDeleteHistory = {
                        text: dbQueries.DB_ADMIN_DELETE_FOCUS_HISTORY,
                        values: [idHistory]
                    };

                    //borra historia
                    client.query(queryDeleteHistory, (err, resultDeleteHistory) => {
                        if (rollback(client, done, err)) {
                            logger.error('deleteHistory - Error eliminado historia:', err);
                            reject(err);
                        } else {
                            logger.notice('deleteHistory - eliminacion de la historia finalizada');
                            resolve(true);
                        }
                    });
                }
            })

        } catch (error) {
            logger.error('deleteHistory - Error eliminando historia:', error);
            reject(error);
        }
    });

}


function newToken() {
    return new Promise((resolve, reject) => {
        try {
            var token = makeToken(10);
            const queryDb = {
                text: dbQueries.DB_FOCUS_EXIST_HISTORY_BY_TOKEN,
                values: [token]
            };

            pool.query(queryDb, function (err, result) {
                if (err) {
                    logger.error('newToken - Error : ', err);
                    reject(err);
                }else{
                    if(result.rowCount!=0){
                        resolve(newToken());
                    }else{
                        logger.notice('newToken - generacion del token correcta');
                        resolve(token);
                    }
                }
            });

        } catch (error) {
            logger.error('newToken - Error generando token :', error);
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

/**
 * Función que crea el token
 * @param {*} length 
 */
function makeToken(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
