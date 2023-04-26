const express = require('express');
const router = express.Router();
const querystring = require('querystring');
const constants = require('../../util/constants');
const utils = require('../../util/utils');
const dbQueries = require('../../db/db-queries');
const http = require('http');
const proxy = require('../../conf/proxy-conf');
const request = require('request');
//Multer for receive form-data
const multer  = require('multer')
var storage = multer.memoryStorage()
const upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, callback) => {
        let path = '../../../assets/public/contenido-general/apps';
        if(fs.existsSync(path+file.originalname)){
            fs.remove(path+file.originalname);
        }
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
const fs = require('fs-extra');
//DB SETTINGS
const db = require('../../db/db-connection');
const pool = db.getPool();
//LOG SETTINGS
const logConfig = require('../../conf/log-conf');
const loggerSettings = logConfig.getLogSettings();
const logger = require('js-logging').dailyFile([loggerSettings]);

router.put(constants.API_URL_ADMIN_STATIC_CONTENT_INFO, function (req, res, next) {
    var content = req.body;
    var id = content.id;
    const query = {
        text: 'UPDATE manager.static_contents SET content = $1 '
        + 'WHERE static_contents.id = $2 ',
        values: [content.contentText, id],
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

router.post(constants.API_URL_ADMIN_STATIC_CONTENT_INFO, upload.single('file'), function (req, res, next) {
    res.json({
        'status': constants.REQUEST_REQUEST_OK,
        'success': true,
        'message': 'Organización insertada correctamente.'                   
    });
    return;
});

router.put(constants.API_URL_ADMIN_STATIC_CONTENT_TOOLS, function (req, res, next) {
    var content = req.body;
    var id = content.id;
    const query = {
        text: 'UPDATE manager.static_contents SET content = $1 '
        + 'WHERE static_contents.id = $2 ',
        values: [content.contentText, id],
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

module.exports = router;