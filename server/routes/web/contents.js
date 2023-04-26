'use strict'

const express = require('express');
const router = express.Router();
const constants = require('../../util/constants');
const http = require('http');
const proxy = require('../../conf/proxy-conf');
//DB SETTINGS
const db = require('../../db/db-connection');
const pool = db.getPool();

//LOG SETTINGS
const logConfig = require('../../conf/log-conf');
const loggerSettings = logConfig.getLogSettings();
const logger = require('js-logging').dailyFile([loggerSettings]);

router.get(constants.API_URL_STATIC_CONTENT_INFO_OPEN_DATA, function (req, res, next) {
    let sectionTitle = constants.STATIC_CONTENT_SECTION_TITLE_INFO;
    let sectionSubtitle = constants.STATIC_CONTENT_SUBSECTION_TITLE_OPEN_DATA;
    const query = {
        text: 'SELECT cnt.id AS "id", sec.id AS "sectionId", sec.title AS "sectionTitle", sec.subtitle AS "sectionSubtitle" '
        + ', sec.description AS "sectionDescription", cnt.content_order AS "contentOrder" ' 
        + ', cnt.title AS "contentTitle", cnt.content AS "contentText", cnt.target_url AS "targetUrl" ' 
        + 'FROM manager.sections sec '
        + 'JOIN manager.static_contents cnt '
        + 'ON sec.id = cnt.id_section '
        + 'WHERE sec.title = $1 AND sec.subtitle = $2 '
        + 'ORDER BY cnt.content_order ASC',
        values: [sectionTitle, sectionSubtitle],
        rowMode: constants.SQL_RESULSET_FORMAT
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

router.get(constants.API_URL_STATIC_CONTENT_INFO_OPEN_DATA + '/terms', function (req, res, next) {
    let sectionTitle = constants.STATIC_CONTENT_SECTION_TITLE_INFO;
    let sectionSubtitle = constants.STATIC_CONTENT_SUBSECTION_TITLE_OPEN_DATA;
    let contentTitle = constants.STATIC_CONTENT_CONTENT_TITLE_TERM;
    
    const query = {
        text: 'SELECT cnt.id AS "id", sec.id AS "sectionId", sec.title AS "sectionTitle", sec.subtitle AS "sectionSubtitle" '
        + ', sec.description AS "sectionDescription", cnt.content_order AS "contentOrder" ' 
        + ', cnt.title AS "contentTitle", cnt.content AS "contentText", cnt.target_url AS "targetUrl" ' 
        + 'FROM manager.sections sec '
        + 'JOIN manager.static_contents cnt '
        + 'ON sec.id = cnt.id_section '
        + 'WHERE sec.title = $1 AND sec.subtitle = $2  and cnt.title = $3 '
        + 'ORDER BY cnt.content_order ASC',
        values: [sectionTitle, sectionSubtitle, contentTitle],
        rowMode: constants.SQL_RESULSET_FORMAT
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

/*
    NOTE: Delete this method if finally it's not necessary.
*/
router.get(constants.API_URL_STATIC_CONTENT_INFO_OPEN_DATA + '/:id', function(req, res, next){
    var id = req.params.id;
    const query = {
        text: 'SELECT cnt.id AS "id", sec.id AS "sectionId", sec.title AS "sectionTitle", sec.subtitle AS "sectionSubtitle" '
        + ', sec.description AS "sectionDescription", cnt.content_order AS "contentOrder" ' 
        + ', cnt.title AS "contentTitle", cnt.content AS "contentText", cnt.target_url AS "targetUrl" ' 
        + 'FROM manager.sections sec '
        + 'JOIN manager.static_contents cnt '
        + 'ON sec.id = cnt.id_section '
        + 'WHERE cnt.id = $1 AND sec.id = 1 '
        + 'ORDER BY cnt.content_order ASC',
        values: [id],
        rowMode: constants.SQL_RESULSET_FORMAT
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

router.get(constants.API_URL_STATIC_CONTENT_INFO_APPS, function (req, res, next) {
    let sectionTitle = constants.STATIC_CONTENT_SECTION_TITLE_INFO;
    let sectionSubtitle = constants.STATIC_CONTENT_SUBSECTION_TITLE_APPS;
    const query = {
        text: 'SELECT cnt.id AS "id", sec.id AS "sectionId", sec.title AS "sectionTitle", sec.subtitle AS "sectionSubtitle" '
        + ', sec.description AS "sectionDescription", cnt.content_order AS "contentOrder" '
        + ', cnt.title AS "contentTitle", cnt.content AS "contentText" '
        + 'FROM manager.sections sec '
        + 'JOIN manager.static_contents cnt '
        + 'ON sec.id = cnt.id_section '
        + 'WHERE sec.title = $1 AND sec.subtitle = $2 '
        + 'ORDER BY cnt.content_order ASC',
        values: [sectionTitle, sectionSubtitle],
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

router.get(constants.API_URL_STATIC_CONTENT_INFO_EVENTS, function (req, res, next) {
    let sectionTitle = constants.STATIC_CONTENT_SECTION_TITLE_INFO;
    let sectionSubtitle = constants.STATIC_CONTENT_SUBSECTION_TITLE_EVENTS;
    const query = {
        text: 'SELECT cnt.id AS "id", sec.id AS "sectionId", sec.title AS "sectionTitle", sec.subtitle AS "sectionSubtitle" '
        + ', sec.description AS "sectionDescription", cnt.content_order AS "contentOrder" '
        + ', cnt.title AS "contentTitle", cnt.content AS "contentText", cnt.target_url AS "targetUrl" '
        + 'FROM manager.sections sec '
        + 'JOIN manager.static_contents cnt '
        + 'ON sec.id = cnt.id_section '
        + 'WHERE sec.title = $1 AND sec.subtitle = $2 '
        + 'ORDER BY cnt.content_order ASC',
        values: [sectionTitle, sectionSubtitle],
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

router.get(constants.API_URL_STATIC_CONTENT_INFO_CONOCIMIENTO, function (req, res, next) {
    let sectionTitle = constants.STATIC_CONTENT_SECTION_TITLE_CONOCIMIENTO;
    let sectionSubtitle = constants.STATIC_CONTENT_SUBSECTION_TITLE_ONTOLOGIA;
    const query = {
        text: 'SELECT cnt.id AS "id", sec.id AS "sectionId", sec.title AS "sectionTitle", sec.subtitle AS "sectionSubtitle" '
        + ', sec.description AS "sectionDescription", cnt.content_order AS "contentOrder" '
        + ', cnt.title AS "contentTitle", cnt.content AS "contentText", cnt.target_url AS "targetUrl" '
        + 'FROM manager.sections sec '
        + 'JOIN manager.static_contents cnt '
        + 'ON sec.id = cnt.id_section '
        + 'WHERE sec.title = $1 AND sec.subtitle = $2 '
        + 'ORDER BY cnt.content_order ASC',
        values: [sectionTitle, sectionSubtitle],
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

router.get(constants.API_URL_STATIC_CONTENT_INFO_COLLABORATION, function (req, res, next) {

});

router.get(constants.API_URL_STATIC_CONTENT_TOOLS_DEVELOPERS, function (req, res, next) {
    let sectionTitle = constants.STATIC_CONTENT_SECTION_TITLE_TOOLS;
    let sectionSubtitle = constants.STATIC_CONTENT_SUBSECTION_TITLE_DEVELOPERS;
    const query = {
        text: 'SELECT cnt.id AS "id", sec.id AS "sectionId", sec.title AS "sectionTitle", sec.subtitle AS "sectionSubtitle" '
        + ', sec.description AS "sectionDescription", cnt.content_order AS "contentOrder" '
        + ', cnt.title AS "contentTitle", cnt.content AS "contentText", cnt.target_url AS "targetUrl" '
        + 'FROM manager.sections sec '
        + 'JOIN manager.static_contents cnt '
        + 'ON sec.id = cnt.id_section '
        + 'WHERE sec.title = $1 AND sec.subtitle = $2 '
        + 'ORDER BY cnt.content_order ASC',
        values: [sectionTitle, sectionSubtitle],
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

router.get(constants.API_URL_STATIC_CONTENT_INFO_COLLABORATION, function (req, res, next) {

});

router.get(constants.API_URL_STATIC_CONTENT_TOOLS_DEVELOPERS, function (req, res, next) {
    let sectionTitle = constants.STATIC_CONTENT_SECTION_TITLE_TOOLS;
    let sectionSubtitle = constants.STATIC_CONTENT_SUBSECTION_TITLE_DEVELOPERS;
    const query = {
        text: 'SELECT cnt.id AS "id", sec.id AS "sectionId", sec.title AS "sectionTitle", sec.subtitle AS "sectionSubtitle" '
        + ', sec.description AS "sectionDescription", cnt.content_order AS "contentOrder" '
        + ', cnt.title AS "contentTitle", cnt.content AS "contentText", cnt.target_url AS "targetUrl" '
        + 'FROM manager.sections sec '
        + 'JOIN manager.static_contents cnt '
        + 'ON sec.id = cnt.id_section '
        + 'WHERE sec.title = $1 AND sec.subtitle = $2 '
        + 'ORDER BY cnt.content_order ASC',
        values: [sectionTitle, sectionSubtitle],
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

router.get(constants.API_URL_STATIC_CONTENT_TOOLS_APIS, function (req, res, next) {
    let sectionTitle = constants.STATIC_CONTENT_SECTION_TITLE_TOOLS;
    let sectionSubtitle = constants.STATIC_CONTENT_SUBSECTION_TITLE_APIS;
    const query = {
        text: 'SELECT cnt.id AS "id", sec.id AS "sectionId", sec.title AS "sectionTitle", sec.subtitle AS "sectionSubtitle" '
        + ', sec.description AS "sectionDescription", cnt.content_order AS "contentOrder" '
        + ', cnt.title AS "contentTitle", cnt.content AS "contentText", cnt.target_url AS "targetUrl" '
        + 'FROM manager.sections sec '
        + 'JOIN manager.static_contents cnt '
        + 'ON sec.id = cnt.id_section '
        + 'WHERE sec.title = $1 AND sec.subtitle = $2 '
        + 'ORDER BY cnt.content_order ASC',
        values: [sectionTitle, sectionSubtitle],
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

module.exports = router;