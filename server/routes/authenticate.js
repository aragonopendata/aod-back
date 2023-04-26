'use strict'
const express = require('express');
const router = express.Router();
const fs = require('fs');
const CryptoJS = require("crypto-js");
const SHA256 = require("crypto-js/sha256");
const jwt = require('jsonwebtoken');
const constants = require('../util/constants');
//DB SETTINGS 
const db = require('../db/db-connection');
const pool = db.getPool();
//LOG SETTINGS
const logConfig = require('../conf/log-conf');
const loggerSettings = logConfig.getLogSettings();
const logger = require('js-logging').dailyFile([loggerSettings]);

//Authenticate 
router.post(constants.API_URL_AUTHENTICATE, function (req, res, next) {
    try {
        let user = req.body.username;
        // Gets password and encrypt it with SHA256 algorithm. After that, converts it in Base64 format.
        let password = SHA256(req.body.password).toString(CryptoJS.enc.Base64);
        const query = {
            text: 'SELECT usr.id AS "userId", usr.name AS "userName" '
                     + ', usr.fullname AS "userFullName", rol."name" as "userRol" '
                     + ', uap.access_key as "userKey" '
                  + 'FROM manager.users usr '
                  + 'JOIN manager.users_roles usrrol '
                    + 'ON usr.id = usrrol.id_user '
                  + 'JOIN manager.roles rol '
                    + 'ON usrrol.id_role = rol.id '
                  + 'JOIN manager.users_applications_permissions uap '
                    + 'ON usr.id = uap.id_user '
                  + 'JOIN manager.applications app '
                    + 'ON uap.id_application = app.id '
                 + 'WHERE usr.name = $1 '
                   + 'AND usr.password = $2 '
                   + 'AND usr.active = true '
                   + 'AND app.appplication_name = $3 '
                   + 'AND app.active = true',
            values: [user, password, constants.APPLICATION_NAME_CKAN],
            rowMode: 'json'
        };

        // pool.on('error', (err, client) => {
        //     logger.error('Error en la conexión con base de datos', err);
        //     process.exit(-1);
        // });

        pool.connect((connError, client, release) => {
            if (connError) {
                logger.error(connError.stack);
                res.json({ status: 500, 'error': connError });
                return;
            }
            client.query(query, (err, queryResult) => {
                release()
                if (err) {
                    logger.error(err.stack);
                    return console.error('Error executing query', err.stack)
                } else {
                    if (queryResult && queryResult.rows && queryResult.rows.length > 0) {
                        logger.info(queryResult.rows);
                        var data = {
                            exp: Math.floor(Date.now() / 1000) + (60 * 120),
                            username: user
                        };
                        var token = generateToken(data);
                        if (token) {
                            logger.error('Token: ' + token);
                            var json = JSON.stringify(queryResult.rows);
                            logger.error('Filas: ' + json);
                            res.json({ status: 200, token: token
                                     , id: queryResult.rows[0].userId
                                     , name: queryResult.rows[0].userName
                                     , fullname: queryResult.rows[0].userFullName
                                     , rol: queryResult.rows[0].userRol
                                     , key: queryResult.rows[0].userKey });
                        } else {
                            res.json({ status: 200 });
                        }
                    } else {
                        res.json({ status: 200 });
                    }
                }

            })
        })
    } catch (err) {
        logger.error('Error en autenticación: ' + err);
        res.json({ status: 500 });
    }
});

function generateToken(data) {
    try {
        // sign with RSA SHA256 
        var cert = fs.readFileSync('server/keys/private_unencrypted.pem');  // get private key 
        var token = jwt.sign(data, cert, { algorithm: 'RS256' });
        return token;
    } catch (err) {
        logger.error('Error generando token: ' + err);
        return null;
    }
}

module.exports = router;