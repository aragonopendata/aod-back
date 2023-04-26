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

router.get(constants.API_URL_CAMPUS_EVENTS, function (req, res, next) {
    var rows = 10;
    var start = 0;
    var text = '%%';
    if (req.query.rows && req.query.page) {
        rows = req.query.rows;
        start = (req.query.page * constants.CAMPUS_EVENTS_PER_PAGE);
    }

    if (req.query.text) {
        text = '%' + req.query.text + '%';
    }

    if (req.query.type) {
        var type = req.query.type;
        var textQuery = 'SELECT distinct evn.id AS "id", evn.name AS "name", evn.description AS "description" '
            + ', evn.date AS "date", sit.name AS "site", count(*) OVER() AS total_count '
            + 'FROM campus.events evn '
            + 'JOIN campus.events_sites evnsit ON evn.id = evnsit.id_event '
            + 'JOIN campus.sites sit ON evnsit.id_site = sit.id '
            + 'JOIN campus.contents cnt ON evn.id = cnt.event '
            + 'WHERE cnt."type" = $1 '
            + 'GROUP BY evn.id, evnsit.id_event, sit.name '
            + 'ORDER BY evn."date" DESC '
            + 'LIMIT $2 '
            + 'OFFSET $3 ';
        var valuesQuery = [type, rows, start];
    } else {
        var textQuery = 'SELECT evn.id AS "id", evn.name AS "name", evn.description AS "description" '
            + ', evn.date AS "date", sit.name AS "site", count(*) OVER() AS total_count '
            + 'FROM campus.events evn '
            + 'JOIN campus.events_sites evnsit ON evn.id = evnsit.id_event  '
            + 'JOIN campus.sites sit ON evnsit.id_site = sit.id  '
            + 'WHERE LOWER(evn.name) like LOWER($3) '
            + 'ORDER BY evn."date" DESC '
            + 'LIMIT $1 '
            + 'OFFSET $2 ';
        var valuesQuery = [rows, start, text];
    }

    const query = {
        text: textQuery,
        values: valuesQuery,
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

router.get(constants.API_URL_CAMPUS_CONTENTS_OF_EVENT, function (req, res, next) {
    const query = {
        text: 'select distinct cnt.id AS id, cnt.title AS title, cnt.description AS description, cnt.url AS url, encode(cnt.thumbnail, \'base64\') AS thumbnail, '
        + 'fmt.name AS format_content, cnt.event AS content_event '
        + ' FROM campus.contents cnt'
        + ' JOIN campus.formats fmt'
        + ' ON cnt.format = fmt.id'
        + ' JOIN campus.events evt'
        + ' ON cnt.format = fmt.id'
        + ' WHERE cnt.event = $1',
        values: [req.query.id],
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

router.get(constants.API_URL_CAMPUS_TYPES, function (req, res, next) {
    var rows = 10;
    var start = 0;
    if (req.query.rows && req.query.page) {
        rows = req.query.rows;
        start = req.query.page;
    }

    const query = {
        text: 'SELECT typ.id AS "value", typ.name AS "label" '
        + 'FROM campus.types typ',
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

router.get(constants.API_URL_CAMPUS_CONTENTS_OF_EVENT, function (req, res, next) {
    const query = {
        text: 'select distinct cnt.id AS id, cnt.title AS title, cnt.description AS description, cnt.url AS url, encode(cnt.thumbnail, \'base64\') AS thumbnail, '
        + 'fmt.name AS format_content, cnt.event AS content_event '
        + ' FROM campus.contents cnt'
        + ' JOIN campus.formats fmt'
        + ' ON cnt.format = fmt.id'
        + ' JOIN campus.events evt'
        + ' ON cnt.format = fmt.id'
        + ' WHERE cnt.event = $1',
        values: [req.query.id],
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

router.get(constants.API_URL_CAMPUS_EVENT + '/:eventName', function (req, res, next) {
    const query = {
        text: 'SELECT evn.id AS "id", evn.name AS "name", evn.description AS "description", evn.date AS "date", sit.name AS "site" '
        + 'FROM campus.events evn '
        + 'JOIN campus.events_sites evnsit ON evn.id = evnsit.id_event '
        + 'JOIN campus.sites sit ON evnsit.id_site = sit.id   '
        + 'WHERE evn.id = $1',
        values: [req.params.eventName],
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

router.get(constants.API_URL_CAMPUS_CONTENT + '/:contentName', function (req, res, next) {
    const query = {
        text: 'select cnt.id AS id, cnt.title AS title, cnt.description AS description, cnt.url AS url, '
        + 'fmt.name AS format, typ.name AS "type", plt.name AS platform, evn.id AS "event_id", evn.name AS "event_name" '
        + 'FROM campus.contents cnt '
        + 'JOIN campus.formats fmt '
        + 'ON cnt.format = fmt.id '
        + 'JOIN campus.types typ '
        + 'ON cnt.type = typ.id '
        + 'JOIN campus.platforms plt '
        + 'ON cnt.platform = plt.id '
        + 'JOIN campus.events evn '
        + 'ON cnt.event = evn.id '
        + 'WHERE cnt.id = $1 ',
        values: [req.params.contentName],
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

router.get(constants.API_URL_CAMPUS_SPEAKERS + '/:contentName', function (req, res, next) {
    const query = {
        text: 'SELECT spk.id AS "id", spk.name AS "name" '
        + 'FROM campus.speakers spk '
        + 'JOIN campus.contents_speakers cnsp '
        + 'ON spk.id = cnsp.id_speaker '
        + 'WHERE cnsp.id_content = $1 ',
        values: [req.params.contentName],
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

router.get(constants.API_URL_CAMPUS_TOPICS + '/:contentName', function (req, res, next) {
    const query = {
        text: 'SELECT top.id AS "id", top.name AS "name" '
        + 'FROM campus.topics top '
        + 'JOIN campus.contents_topics cntop '
        + 'ON top.id = cntop.id_topic '
        + 'WHERE cntop.id_content = $1 ',
        values: [req.params.contentName],
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