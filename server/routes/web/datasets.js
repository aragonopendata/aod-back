const express = require('express');
const router = express.Router();
const http = require('http');
const constants = require('../../util/constants');
const proxy = require('../../conf/proxy-conf');
const utils = require('../../util/utils');
const querystring = require('querystring');
const request = require('request');
const csvWriter = require('csv-write-stream');
const iconv = require('iconv-lite');
const crypto = require('crypto')
//DB SETTINGS 
const db = require('../../db/db-connection');
const dbQueries = require('../../db/db-queries');
const pool = db.getCkanPool();
//LOG SETTINGS
const logConfig = require('../../conf/log-conf');
const loggerSettings = logConfig.getLogSettings();
const logger = require('js-logging').dailyFile([loggerSettings]);
const atob = require('atob');

/** GET DATASETS PAGINATED */
router.get(constants.API_URL_DATASETS, function (req, res, next) {
    try {
        logger.debug('Servicio: Listado de datasets paginados');
        let serviceBaseUrl = constants.CKAN_API_BASE_URL;
        let serviceName = constants.DATASETS_SEARCH;
        let serviceRequestUrl = serviceBaseUrl + serviceName + utils.getRequestCommonParams(req);
        if (req.query.text) {
            let texto_ny = req.query.text.toLocaleLowerCase().split(' ').join('-').split('ñ').join('ny')
                .split('á').join('a').split('é').join('e').split('í').join('i').split('ó').join('o').split('ú').join('u')
                .split('ä').join('a').split('ë').join('e').split('ï').join('i').split('ö').join('o').split('ü').join('u');
            let texto_n = req.query.text.toLocaleLowerCase().split(' ').join('-').split('ñ').join('n')
                .split('á').join('a').split('é').join('e').split('í').join('i').split('ó').join('o').split('ú').join('u')
                .split('ä').join('a').split('ë').join('e').split('ï').join('i').split('ö').join('o').split('ü').join('u');

            logger.info(texto_ny + " " + texto_n);

            let text_ny = texto_ny.split('-');
            let text_n = texto_n.split('-');

            serviceRequestUrl += '&q=(';
            //Title dataset
            for(var i = 0; i < text_n.length; i++){ 
                serviceRequestUrl += 'title:' + encodeURIComponent(text_n[i]) + '';
                if(i != text_n.length-1){
                    serviceRequestUrl += ' AND ';
                }
            }
            serviceRequestUrl += ') OR (';
            //Description dataset
            for(var i = 0; i < text_n.length; i++){ 
                serviceRequestUrl += 'notes:' + encodeURIComponent(text_n[i]) + '';
                if(i != text_n.length-1){
                    serviceRequestUrl += ' AND ';
                }
            }
            serviceRequestUrl += ')';
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
                res.json(body);
            });
        }).on('error', function (err) {
            utils.errorHandler(err, res, serviceName);
        });
    } catch (error) {
        logger.error('Error in route' + constants.API_URL_DATASETS);
    }
});

/** GET DATASETS BY AUTOCOMPLETE */
router.get(constants.API_URL_DATASETS_AUTOCOMPLETE, function (req, res, next) {
    try {
        logger.debug('Servicio: Obtener nombres de dataset mediante texto autocompletado');
        let serviceBaseUrl = constants.CKAN_API_BASE_URL;
        let serviceName = constants.DATASETS_SEARCH_AUTOCOMPLETE;
        let serviceRequestUrl = serviceBaseUrl + serviceName + utils.getRequestCommonParams(req);
        if (req.query.text) {
            serviceRequestUrl += '&q=' + encodeURIComponent(req.query.text);
        } else {
            serviceRequestUrl += '&q=%%';
        }
        if (req.query.limit) {
            serviceRequestUrl += '&limit=' + req.query.limit;
        } else {
            serviceRequestUrl += '&limit=' + constants.DATASETS_AUTOCOMPLETE_LIMIT;
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
                res.json(body);
            });
        }).on('error', function (err) {
            utils.errorHandler(err, res, serviceName);
        });
    } catch (error) {
        logger.error('Error in route' + constants.API_URL_DATASETS_AUTOCOMPLETE);
    }
});

/** GET DATASETS BY TAGS */
router.get(constants.API_URL_DATASETS_TAGS, function (req, res, next) {
    try {
        logger.debug('Servicio: Obtener datasets por tags');
        let serviceBaseUrl = constants.CKAN_API_BASE_URL;
        let serviceName = constants.DATASETS_SEARCH;
        let serviceRequestUrl = serviceBaseUrl + serviceName + utils.getRequestCommonParams(req) + utils.getRequestTags(req.query.tags);
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
            utils.errorHandler(err, res, serviceName);
        });
    } catch (error) {
        logger.error('Error in route' + constants.API_URL_DATASETS_TAGS);
    }
});

/** GET NEWEST DATASETS */
router.get(constants.API_URL_DATASETS_NEWEST, function (req, res, next) {
    try {
        logger.debug('Servicio: Obtener datasets recientes');
        let serviceBaseUrl = constants.CKAN_API_BASE_URL;
        let serviceName = constants.DATASETS_SEARCH_NEWEST;
        let serviceRequestUrl = serviceBaseUrl + serviceName;
        if (req.query.rows) {
            serviceRequestUrl += '&rows=' + req.query.rows;
        } else {
            serviceRequestUrl += '&rows=' + constants.DATASETS_SEARCH_NEWEST_ROWS_LIMIT;
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
                res.json(body);
            });
        }).on('error', function (err) {
            utils.errorHandler(err, res, serviceName);
        });
    } catch (error) {
        logger.error('Error in route' + constants.API_URL_DATASETS_NEWEST);
    }
});

/** GET MOST DOWNLOADED DATASETS */
router.get(constants.API_URL_DATASETS_DOWNLOADED, function (req, res, next) {
    try {
        logger.debug('Servicio: Obtener datasets más descargados');
        let serviceBaseUrl = constants.CKAN_API_BASE_URL;
        let serviceName = constants.DATASETS_SEARCH_MOST_DOWNLOADED;
        let serviceRequestUrl = serviceBaseUrl + serviceName;
        if (req.query.rows) {
            serviceRequestUrl += '&rows=' + req.query.rows;
        } else {
            serviceRequestUrl += '&rows=' + constants.DATASETS_SEARCH_MOST_DOWNLOADED_ROWS_LIMIT;
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
                res.json(body);
            });
        }).on('error', function (err) {
            utils.errorHandler(err, res, serviceName);
        });
    } catch (error) {
        logger.error('Error in route' + constants.API_URL_DATASETS_DOWNLOADED);
    }

});

/** GET NUMBER OF DATASETS AND RESOURCES */
router.get(constants.API_URL_DATASETS_COUNT, function (req, res, next) {
    try {
        logger.debug('Servicio: Obtener número de datasets y recursos');
        let serviceBaseUrl = constants.CKAN_API_BASE_URL;
        let serviceName = constants.DATASETS_SEARCH_COUNT;
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

        http.get(httpConf, function (results) {
            var body = '';
            results.on('data', function (chunk) {
                body += chunk;
            });
            results.on('end', function () {
                res.json(body);
            });
        }).on('error', function (err) {
            utils.errorHandler(err, res, serviceName);
        });
    } catch (error) {
        logger.error('Error in route' + constants.API_URL_DATASETS_COUNT);
    }
});

router.get(constants.API_URL_RESOURCES_COUNT, function (req, res, next) {
    try {
        logger.debug('Servicio: Número de Recursos');
        let serviceBaseUrl = constants.CKAN_API_BASE_URL;
        let serviceName = constants.RESOURCES_SEARCH_COUNT;
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

        http.get(httpConf, function (results) {
            var body = '';
            results.on('data', function (chunk) {
                body += chunk;
            });
            results.on('end', function () {
                res.json(body);
            });
        }).on('error', function (err) {
            utils.errorHandler(err, res, serviceName);
        });
    } catch (error) {
        logger.error('Error in route' + constants.API_URL_RESOURCES_COUNT);
    }
});

router.get(constants.API_URL_DATASETS_VOTES_COUNT, (req, res, next) => {
    logger.info('Realizando petición de conteo de votos por dataset.');
    const query = {
        text: dbQueries.DB_CKAN_TOTAL_RATING,
        rowMode: constants.SQL_RESULSET_FORMAT_JSON
    };

    pool.on('error', (err, client) => {
        logger.error('Error en la conexión con base de datos', err);
        process.exit(-1);
    });

    pool.connect((err, client, done) => {
        if (err) {
            logger.error(err.stack);
            res.json({ status: 500, 'error': err });
            return;
        }
        pool.query(query, (err, result) => {
            done();
            if (err) {
                logger.error(err.stack);
                res.json({ status: 500, 'error': err });
                return;
            } else {
                logger.info('Filas devueltas: ' + result.rows.length);
                res.json(result.rows);
            }
        });
    });
});

/** GET DATASETS BY TOPIC */
router.get(constants.API_URL_DATASETS_TOPIC + '/:topicName', function (req, res, next) {
    try {
        logger.debug('Servicio: Listado de datasets por tema');
        let serviceBaseUrl = constants.CKAN_API_BASE_URL;
        let serviceName = constants.DATASETS_SEARCH;
        let serviceRequestUrl = serviceBaseUrl + serviceName + utils.getRequestCommonParams(req);
        if (req.params.topicName) {
            serviceRequestUrl += '&fq=groups:' + req.params.topicName;
        }
        if (req.query.type) {
            //TODO TYPES
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
                res.json(body);
            });
        }).on('error', function (err) {
            utils.errorHandler(err, res, serviceName);
        });
    } catch (error) {
        logger.error('Error in route' + constants.API_URL_DATASETS_TOPIC);
    }
});

/** GET DATASETS BY ORGANIZATION */
router.get(constants.API_URL_DATASETS_ORGANIZATION + '/:organizationName', function (req, res, next) {
    try {
        logger.debug('Servicio: Listado de datasets por organización');
        let serviceBaseUrl = constants.CKAN_API_BASE_URL;
        let serviceName = constants.DATASETS_SEARCH;
        let serviceRequestUrl = serviceBaseUrl + serviceName + utils.getRequestCommonParams(req);
        if (req.params.organizationName) {
            serviceRequestUrl += '&fq=organization:' + req.params.organizationName;
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
                res.json(body);
            });
        }).on('error', function (err) {
            utils.errorHandler(err, res, serviceName);
        });
    } catch (error) {
        logger.error('Error in route' + constants.API_URL_DATASETS_ORGANIZATION);
    }

});

/** GET DATASET BY NAME */
router.get(constants.API_URL_DATASETS + '/:datasetName', function (req, res, next) {
    try {
        logger.debug('Servicio: Obtener dataset por nombre');
        let serviceBaseUrl = constants.CKAN_API_BASE_URL;
        let serviceName = constants.DATASET_SHOW;
        let serviceRequestUrl = serviceBaseUrl + serviceName + '?id=' + req.params.datasetName;
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
            utils.errorHandler(err, res, serviceName);
        });
    } catch (error) {
        logger.error('Error in route' + constants.API_URL_DATASETS);
    }
});

/** GET DATASET HOMER */
router.get(constants.API_URL_DATASETS_HOMER, function (req, res, next) {
    try {
        logger.debug('Servicio: Obtener dataset HOMER');
        let serviceBaseUrl = constants.HOMER_API_BASE_URL;
        let serviceRequestUrl = serviceBaseUrl + utils.getRequestHomerCommonParams(req);
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
            utils.errorHandler(err, res, serviceName);
        });
    } catch (error) {
        logger.error('Error in route' + constants.API_URL_DATASETS_HOMER);
    }
});

/** GET DATASET HOMER BY PACKAGEID */
router.get(constants.API_URL_DATASETS_HOMER + '/:datasetHomerName', function (req, res, next) {
    try {
        logger.debug('Servicio: Obtener dataset homer por identificador');
        let serviceBaseUrl = constants.HOMER_API_BASE_URL;
        let serviceRequestUrl = serviceBaseUrl + '?q=package_id:' + req.params.datasetHomerName + '&wt=json';
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
            utils.errorHandler(err, res, serviceName);
        });
    } catch (error) {
        logger.error('Error in route' + constants.API_URL_DATASETS_HOMER);
    }
});

/** GET RDF FILE OF DATASET */
router.get(constants.API_URL_DATASETS_RDF + '/:datasetName', function (req, res, next) {
    try {
        logger.debug('Servicio: Obtener RDF del dataset por nombre');
        let serviceBaseUrl = constants.CKAN_BASE_URL;
        let serviceName = constants.DATASET_RDF_DATASET;
        let serviceRequestUrl = serviceBaseUrl + ':' + constants.CKAN_BASE_PORT + serviceName + '/' + req.params.datasetName + constants.DATASET_RDF_EXTENSION;
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
            utils.errorHandler(err, res, serviceName);
        });
    } catch (error) {
        logger.error('Error in route' + constants.API_URL_DATASETS_RDF);
    }
});

/** GET DATASETS BY STATS SEARCH  */
router.get(constants.API_URL_DATASETS_STATS_SEARCH + '/:groupName', function (req, res, next) {
    try {
        logger.debug('Servicio: Listado de datasets por información estadistica');
        let serviceBaseUrl = constants.CKAN_API_BASE_URL;
        let serviceName = constants.DATASETS_SEARCH;
        let serviceRequestUrl = serviceBaseUrl + serviceName + utils.getRequestCommonParams(req);

        if (req.params.groupName != 'undefined') {
            serviceRequestUrl += '&q=(organization:instituto-aragones-estadistica AND 01_IAEST_Temaestadistico:' + req.params.groupName + '*) ';
        } else {
            serviceRequestUrl += '&q=(organization:instituto-aragones-estadistica) ';
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
                res.json(body);
            });
        }).on('error', function (err) {
            utils.errorHandler(err, res, serviceName);
        });
    } catch (error) {
        logger.error('Error in route' + constants.API_URL_DATASETS_STATS_SEARCH);
    }
});


/** GET DATASETS BY ORGS AND TOPIC  */
router.get(constants.API_URL_DATASETS_SIU, function (req, res, next) {
    console.log('Request received: orgs: ' + req.query.orgs);
    console.log('Request received: tema: ' + req.query.tema);
    let names = [];
    let topics = [];
    let topic_search = false;
    let org_search = false;

    try {
        function getOrgsBySiuCode(){
            return new Promise(resolve => {
                let serviceRequestUrl = constants.CKAN_API_BASE_URL + 'organization_list?all_fields=true&include_extras=true';
                siu_codes = req.query.orgs.split(' ');

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
                        jsonObj = JSON.parse(body);

                        if (jsonObj.success && jsonObj.result){
                            jsonObj.result.forEach(element => {
                                if(element.extras){
                                    element.extras.forEach(e => {
                                        if(e.key === 'siuCode') {
                                            let values = e.value.split(',').map(el => { return el.trim() });
                                            values.forEach(aOrg => {
                                                siu_codes.find(t => {return t === aOrg}) === aOrg ? names.push(element.name) : undefined
                                            })
                                        }
                                    });
                                }
                            });
                        }

                        names = [...new Set(names)];
                        if (req.query.orgs === 'ALL') {
                            names.push('ALL');
                        }
                        resolve(true);
                    });
                }).on('error', function (err) {
                    utils.errorHandler(err, res, serviceName);
                    resolve(false);
                });
            });
        }

        function getTopicsByAragonTopic() {
            return new Promise(resolve => {
                let serviceRequestUrl = constants.CKAN_API_BASE_URL + 'group_list?all_fields=true&include_extras=true';
                aragon_topics = req.query.tema.split(' ');

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
                        jsonObj = JSON.parse(body);
                        if (jsonObj.success && jsonObj.result){
                            jsonObj.result.forEach(element => {
                                if(element.extras){
                                    element.extras.forEach(e => {
                                        if(e.key === 'aragonTopic') {
                                            let values = e.value.split(',').map(el => { return el.trim() });
                                            values.forEach(aTopic => {
                                                aragon_topics.find(t => {return t === aTopic}) === aTopic ? topics.push(element.name) : undefined
                                            })
                                        }
                                    });
                                }
                            });
                        }
                        topics = [...new Set(topics)];
                        resolve(true);
                    });
                }).on('error', function (err) {
                    utils.errorHandler(err, res, serviceName);
                    resolve(false);
                });
            });
        }

        function getDatsetsByOrgsTopic() {
            logger.debug('Servicio: Listado de datasets por organización y tema');
            // serviceRequestUrl = constants.CKAN_API_BASE_URL + constants.DATASETS_SEARCH;

            let serviceBaseUrl = constants.CKAN_API_BASE_URL;
            let serviceName = constants.DATASETS_SEARCH;
            let serviceRequestUrl = serviceBaseUrl + serviceName + utils.getRequestCommonParams(req);

            let groups = topics.join(" OR ");
            let orgs = names.join(" OR ");

            let pageNumber = (req.query.page !== undefined ? req.query.page : 0);
            let rowsNumber = (req.query.rows !== undefined ? req.query.rows : 20);
            
            if (topic_search) {
                serviceRequestUrl += '&fq=(groups:(' + groups + '))';
            } else if (org_search) {
                serviceRequestUrl += '&fq=(organization:(' + orgs + '))';
            } else if ((groups === '' || groups === undefined) || (orgs === '' || orgs === undefined)) {
                serviceRequestUrl += '&fq=(groups:( null ) AND (organization:( null )))';
            } else if (orgs === 'ALL') {
                serviceRequestUrl += '&fq=(groups:(' + groups + '))';            
            } else {                
                serviceRequestUrl += '&fq=(groups:(' + groups + ') AND (organization:(' + orgs + ')))';            
            }

            //Proxy checking
            let httpConf = null;
            if (constants.REQUESTS_NEED_PROXY == true) {
                logger.warning('Realizando petición a través de proxy');
                let httpProxyConf = proxy.getproxyOptions(serviceRequestUrl);
                httpConf = httpProxyConf;
            } else {
                httpConf = serviceRequestUrl;
            }
    
            logger.notice('URL de petición: ' + serviceRequestUrl);
            console.log(serviceRequestUrl);
            console.log(httpConf);
            http.get(serviceRequestUrl, function (results) {
                var body = '';
                results.on('data', function (chunk) {
                    body += chunk;
                });
                results.on('end', function () {
                    res.json(body);
                });
            }).on('error', function (err) {
                utils.errorHandler(err, res, serviceName);
            });
        }

        const promises = [];

        if ((req.query.orgs !== undefined && (req.query.orgs.includes('ORG') || req.query.orgs === 'ALL')) ||
            (req.query.tema !== undefined)) {

            if ((req.query.orgs.split(' ')[0].trim() === '' ||
                 req.query.orgs.split(' ')[0].trim() === undefined) &&
                (req.query.tema.split(' ')[0].trim() != '' &&
                 req.query.tema.split(' ')[0].trim() != undefined) ) {
                topic_search = true;
            } else if ((req.query.tema.split(' ')[0].trim() === '' ||
                        req.query.tema.split(' ')[0].trim() === undefined) &&
                       (req.query.orgs.split(' ')[0].trim() != '' &&
                        req.query.orgs.split(' ')[0].trim() != undefined) ) {
                org_search = true;
            }

            promises.push(getOrgsBySiuCode());
            promises.push(getTopicsByAragonTopic());

            const runPromises = Promise.all(promises).then(result => {
                console.log('names:' + names);
                console.log('topics:' + topics);
                if (names.length === 0) {
                    org_search = false;
                }
            });
    
            (async function() {
                await runPromises;
                getDatsetsByOrgsTopic();
            })();

        } else {
            names = req.query.orgs.split(' ');
            topics = req.query.tema.split(' ');

            getDatsetsByOrgsTopic();
        }

    } catch (error) {
        logger.error('Error in route' + constants.API_URL_DATASETS_SIU);
        logger.error(error);
    }
});

/** GET DATASETS RESOURCE_VIEW */
router.get(constants.API_URL_DATASETS_RESOURCE_VIEW, function (req, res, next) {
    try {

        logger.debug('Servicio: Obtener vistas de los recursos');
        let serviceBaseUrl = constants.CKAN_API_BASE_URL;
        let serviceName = constants.DATASETS_RESOURCE_VIEW;
        let serviceRequestUrl = serviceBaseUrl + serviceName + '?id=' + req.query.resId;

        var query = '';
        let resParams = [];

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
            utils.errorHandler(err, res, serviceName);
        });
    } catch (error) {
        logger.error('Error in route' + constants.API_URL_DATASETS_RESOURCE_VIEW);
    }
});

/** DOWNLOAD CSV FILE FROM PX */
router.get(constants.API_URL_DATASETS + '/:datasetName' + constants.API_URL_RESOURCE_CSV + '/:resourceName', function (req, res, next) {
    try {
        if (req.params.resourceName) {
            var resource = req.params.resourceName;
            var fileName = resource.substring(resource.lastIndexOf('-')+1).replace(new RegExp('.px', 'g'), '.csv');
            resource = resource.replace(new RegExp('-', 'g'), '/');
            serviceRequestUrl = constants.API_URL_IAEST_PX_FILES + resource;
        } else{
            res.json({'error': 'No existe archivo'});
        }

        logger.debug('Servicio: Generar archivo CSV al vuelo desde un PX');
        logger.notice('URL lectura de archivo: ' + serviceRequestUrl);

        var httpRequestOptions = {
            url: serviceRequestUrl,
            method: constants.HTTP_REQUEST_METHOD_GET,
            headers: {
                'User-Agent': constants.HTTP_REQUEST_HEADER_USER_AGENT_NODE_SERVER_REQUEST,
            },
            encoding: null
        };
        request(httpRequestOptions, function (err, response, body) {
            if (err) {
                utils.errorHandler(err, res, serviceName);
            }
            if (response) {
                if (response.statusCode == 200) {
                    var buffer = iconv.decode(Buffer.from(body), 'iso-8859-1');
                    res.setHeader('Content-disposition', 'attachment; filename=' + fileName);
                    var data = parsePXFile(buffer);
                    var writer = csvWriter({headers: data[0]})
                    writer.pipe(res);
                    data[1].forEach(fila => {
                        writer.write(fila);    
                    });
                    writer.end();
                } else {
                    res.json(JSON.stringify(res.statusCode) + ' - ' + JSON.stringify(res.statusMessage));
                }
            } else {
                res.json({ 'status': '500', 'error': 'OBTENER CSV - No se ha podido generar el archivo CSV' });
            }
        });
    } catch (error) {
        logger.error('Error in route' + contants.API_URL_DATASETS_RESOURCE_CSV);
    }
});

/** UPDATE TRACKING OF DATASET */
router.post(constants.API_URL_DATASETS_TRACKING, function (req, res, next) {
    try{
        let user = crypto.createHash('md5').update(req.body.user_key).digest('hex');
        let url = req.body.url;
        const query = {
            text: 'INSERT INTO public.tracking_raw(user_key, url, tracking_type, access_timestamp) '
            + 'VALUES ($1, $2, $3, now()) ',
            values: [user, url, constants.CKAN_TRACKING_TYPE_PARAM_PAGE]
        };

        pool.connect((connError, client, release) => {
            if (connError) {
                logger.error(connError.stack);
                res.json({ status: constants.REQUEST_ERROR_INTERNAL_ERROR, 'error': connError });
                return;
            }
            client.query(query, (err, queryResult) => {
                if (err) {
                    logger.error(err.stack);
                    return console.error('Error executing query', err.stack)
                } else {
                    client.query('COMMIT', (commitError) => {
                        release();
                        if (commitError) {
                            logger.notice('Error realizando commit: ' + commitError);
                            res.json({ status: constants.REQUEST_ERROR_INTERNAL_ERROR, 'error': commitError });
                        } else {
                            logger.notice('Tracking insertado correctamente');
                            res.json({ status: 200 });
                        }
                    });
                }
            })
        })
    } catch (error) {
        logger.error('ACTUALIZACIÓN DEL TRACKING - Error actualizando tracking');
        res.json({ 'status': constants.REQUEST_ERROR_INTERNAL_ERROR, 'error': 'ACTUALIZACIÓN DEL TRACKING - Error actualizando tracking' });
    }
});


/**********************************************************************************/
function parsePXFile(data) {
    let headersNames = [];
    const headersOrder = [];
    let labelsNames = [];
    const values = [];
    let dataTable = [];
    let headerTable = [];
    let parse = 'init';
    data = data.replace(/\s+/g, ' ').trim();
  
    // Prepare the Headers Names
    parse = data.match(/HEADING=[.\s\S]*?;/);
    parse = parse[0]
      .split('=')
      .pop()
      .slice(0, -1);
    headersNames = parse
      .replace(/",\s?\S?"/g, '"############"')
      .split('############');
    headersNames.forEach((element, index) => {
      headersNames[index] = element.replace(/"/g, '').replace(/^\s+/g, '');
    });
  
    // Prepare the Headers Names of the labels/stub
    parse = data.match(/STUB=[.\s\S]*?;/);
    parse = parse[0]
      .split('=')
      .pop()
      .slice(0, -1);
    labelsNames = parse
      .replace(/"\s?\S?"/g, '"############"')
      .split('############');
      
    labelsNames.forEach((element, index) => {
      labelsNames[index] = element.replace(/"/g, '').replace(/^\s+/g, '');
    });
  
    // GET all Headers AND Descriptions of the px file
    while (parse != null) {
      parse = data.match(/VALUES\(.*?\)=[.\s\S]*?";/);
      if (parse != null) {
        let parse2 = parse;
        parse = parse[0].slice(7, -1);
        parse2 = parse2[0].slice(8, -1);

        //let aux3 = parse.match(/[.\s\S]*?\)/).toString();
        let aux3 = parse2.match(/[.\s\S]*?\=/).toString();
        aux3 = aux3.slice(0, aux3.length - 3);
        //aux3 = aux3.slice(0, aux3.length - 1);
        aux3 = aux3.replace(/"/g, '').replace(/^\s+/g, '');
        headersOrder.push(aux3);
        parse = parse
          .split('=')
          .pop()
          .slice(0, -1);
  
        const aux2 = parse
          .replace(/",\s?\S?"/g, '"############"')
          .split('############');
        aux2.forEach((element, index) => {
          aux2[index] = element.replace(/"/g, '').replace(/^\s+/g, '');
        });
        values.push(aux2);
  
        data = data.split(parse).pop();
      }
    }
  
    // Prepare Table Data
    parse = data.match(/DATA=[.\s\S]*?;/);
    parse = parse[0]
      .split('= ')
      .pop()
      .slice(0, -1);
    const auxDataTable2 = parse.split(' ');
  
    auxDataTable2.forEach((element, index) => {
      if (element === '"."') {
        auxDataTable2[index] = null;
      }
    });
  
    const auxDataTable = auxDataTable2.map(function(x) {
    const n = Number(x);
    const decimals = contDec(n, x);
    const fullN = parseFloat(x).toFixed(decimals);
    
      if (isNaN(fullN)) {
        return null;
      } else {
        return fullN;
      }
    });
  
    ///////////////////////////////////////////////////////////
    // Duplicate arrays to match the superior headers and add that header
  
    // Get the headers array pointers
    const pointersHeaders = [];
  
    headersNames.reverse().forEach(element => {
      const indexHeader = headersOrder.findIndex(dato => dato === element);
  
      pointersHeaders.push(values[indexHeader]);
    });
  
    pointersHeaders.reverse().forEach((element, index) => {
      if (index + 1 < pointersHeaders.length) {
        const clone = pointersHeaders[index + 1].slice(0);
        element.forEach((e, index2) => {
          if (index2 === 0) {
            pointersHeaders[index + 1] = [];
          }
          pointersHeaders[index + 1] = pointersHeaders[index + 1].concat(
            clone.map(z => e + ' ' + z)
          );
        });
      }
    });
    headerTable = pointersHeaders[pointersHeaders.length - 1];
    ///////////////////////////////////////////////////////////
  
    // Indicate where to cut on the array and create the respective chucks
    dataTable = chuck(auxDataTable, headerTable.length);
    if (
      dataTable[dataTable.length - 1][0] == null &&
      dataTable[dataTable.length - 1].length <= 1
    ) {
      dataTable.pop();
    }
  
    ///////////////////////////////////////////////////////////
    // Prepare the Labels/STUB
  
    // Get the labels array pointers
    const pointersLabels = [];
    const indexLabels = [];
  
    labelsNames.forEach(element => {
      const indexHeader = headersOrder.findIndex(dato => dato === element);
  
      pointersLabels.push(values[indexHeader]);
      indexLabels.push(indexHeader);
    });
  
    pointersLabels.forEach((element, index) => {
      if (index + 1 < pointersLabels.length) {
        const auxiliar = [];
        element.forEach(e => {
          for (let i = 0; i < pointersLabels[index + 1].length; i++) {
            auxiliar.push(e);
          }
        });
        pointersLabels[index] = auxiliar;
      } else {
        const clone = element.slice(0);
        let auxiliar = [];
        for (
          let indice = 0;
          indice < Math.floor(dataTable.length / clone.length);
          indice++
        ) {
          auxiliar = auxiliar.concat(clone);
        }
        pointersLabels[index] = auxiliar;
      }
    });
  
    indexLabels.reverse();
  
    // Add the ROW labels to the table
    pointersLabels.reverse().forEach((element, index) => {
      headerTable.unshift(labelsNames[indexLabels[index]]);
      element.forEach((e, i) => {
        if (dataTable[i] !== undefined) {
          dataTable[i].unshift(e);
        }
      });
    });
  
    ///////////////////////////////////////////////////////////
    return [headerTable, dataTable];
  }
  
  // split array into chucks of the size parameter
  function chuck(array, size) {
    const results = [];
    while (array.length) {
      results.push(array.splice(0, size));
    }
    return results;
  }

  function contDigits(num) {
    let i = 0;
    while (num >= 1) {
        ++i;
        num /= 10;
    }
    return i;
}

function contDec(num, x) {
    if (typeof num != 'number') return null;
    x = String(x).split('.')[1];
    if (x != undefined) {return String(x).length;}
    else {return 0;}
    
}

//RATING
router.get(constants.API_URL_DATASETS + "/:datasetName/:rating", function (req, res, next) {
    try {
        let datasetName = req.params.datasetName;
        var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        let rating = req.params.rating;
        let serviceName = constants.RATING_SERVICE_NAME;
        let serviceRequestUrl = constants.EXPRESS_NODE_REDIRECT_ROUTING_URL + 
            constants.CKAN_URL_PATH_RATING_DATASET + constants.CKAN_URL_PATH_TRACKING_DATASET + "/" + datasetName + "/" + rating;
        
        let httpConf = null;
        if (constants.REQUESTS_NEED_PROXY == true) {
            logger.warning('Realizando petición a través de proxy');
            let httpProxyConf = proxy.getproxyOptions(serviceRequestUrl);
            httpConf = httpProxyConf;
        } else {
            var httpRequestOptions = {
                url: serviceRequestUrl,
                method: constants.HTTP_REQUEST_METHOD_GET,
                headers: {
                    'x-forwarded-for': ip,
                },
                encoding: null
            };
        }
        request(httpRequestOptions, function (err, response) {
            if (err) {
                utils.errorHandler(err, response, serviceName);
            }
            if (response) {
                res.json({statusCode: response.statusCode});
            } else {
                res.json({ statusCode: 500, error: 'No se ha podido registrar el voto' });
            }
        });

    } catch (error) {
        logger.error('Error in rating ' + constants.CKAN_URL_PATH_RATING_DATASET + constants.CKAN_URL_PATH_TRACKING_DATASET + "/" + datasetName + "/" + rating);
        logger.error(error);
    }
});

module.exports = router;