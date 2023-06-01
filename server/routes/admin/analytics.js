const express = require('express');
const router = express.Router();
const constants = require('../../util/constants');
const logstashUtils = require('../../util/logstash');
const elasticUtils = require('../../util/elasticsearch');

//LOG SETTINGS
const logConfig = require('../../conf/log-conf');
const loggerSettings = logConfig.getLogSettings();
const logger = require('js-logging').dailyFile([loggerSettings]);

/** GET ALL LOGSTASH CONFIG */
router.get('/logstash', function (req, res) {
    try {
        logstashUtils.getAllFilesDB().then(files => {
            res.json({
                'status': constants.REQUEST_REQUEST_OK,
                'message': files
            });
        }).catch(error => {
            throw new Error(error);
        });
    } catch (error) {
        res.json({
            'status': constants.REQUEST_ERROR_INTERNAL_ERROR,
            'message': error
        })
    }
});

/** NEW LOGSTASH */
router.post('/logstash', function (req, res) {
    try {
        logstashUtils.insertLogstashDB(req.body).then((id) => {
            logstashUtils.createPipeline(req.body, id);
            elasticUtils.createPortal(id);
            res.json({
                'status': constants.REQUEST_REQUEST_OK,
                'message': 'Correcto'
            });
        }).catch(error => {
            throw new Error(error);
        });
    } catch (error) {
        res.json({
            'status': constants.REQUEST_ERROR_INTERNAL_ERROR,
            'message': error
        });
    }
});

/** UPDATE LOGSTASH */
router.put('/logstash/:logid', function (req, res) {
    try {
        logstashUtils.updateLogstashDB(req.body, req.params.logid).then(() => {
            logstashUtils.createPipeline(req.body, req.params.logid);
            elasticUtils.updatePortal(req.body, req.params.logid);
            res.json({
                'status': constants.REQUEST_REQUEST_OK,
                'message': 'OK'
            });
        }).catch(error => {
            throw new Error(error);
        });
    } catch (error) {
        res.json({
            'status': constants.REQUEST_ERROR_INTERNAL_ERROR,
            'message': error
        });
    }
});

/** ENABLE LOGSTASH */
router.get('/logstash/:logid/enable', function (req, res) {
    try {
        var id = req.params.logid;
        logstashUtils.enableLogstashDB(id).then(() => {
            logstashUtils.getAllFilesEnabledDB().then(files => {
                logstashUtils.reloadPipelinesConf(files);
                res.json({
                    'status': constants.REQUEST_REQUEST_OK,
                    'message': 'OK'
                });
            }).catch(error => {
                throw new Error(error);
            });
        }).catch(error => {
            throw new Error(error);
        });
    } catch (error) {
        res.json({
            'status': constants.REQUEST_ERROR_INTERNAL_ERROR,
            'message': error
        });
    }
});

/** DISABLE LOGSTASH */
router.get('/logstash/:logid/disable', function (req, res) {
    try {
        var id = req.params.logid;
        logstashUtils.disableLogstashDB(id).then(() => {
            logstashUtils.getAllFilesEnabledDB().then(files => {
                logstashUtils.reloadPipelinesConf(files);
                res.json({
                    'status': constants.REQUEST_REQUEST_OK,
                    'message': 'OK'
                });
            }).catch(error => {
                throw new Error(error);
            });
        }).catch(error => {
            throw new Error(error);
        });
    } catch (error) {
        res.json({
            'status': constants.REQUEST_ERROR_INTERNAL_ERROR,
            'message': error
        });
    }
});

/** DELETE LOGSTASH */
router.delete('/logstash/:logid', function (req, res) {
    try {
        var id = req.params.logid;
        logstashUtils.deleteLogstashDB(id).then(() => {
            logstashUtils.getAllFilesEnabledDB().then(files => {
                logstashUtils.reloadPipelinesConf(files);
                logstashUtils.deletePipeline(id);
                elasticUtils.deletePortal(id);
                res.json({
                    'status': constants.REQUEST_REQUEST_OK,
                    'message': 'OK'
                });
            }).catch(error => {
                throw new Error(error);
            });
        }).catch(error => {
            throw new Error(error);
        });
    } catch (error) {
        res.json({
            'status': constants.REQUEST_ERROR_INTERNAL_ERROR,
            'message': error
        });
    }
});

/** RELOAD DAYS  */
router.post('/logstash/:logid/reload', async function (req, res) {
    try {
        var id = req.params.logid;
        var fromT = req.body.from;
        var toT = req.body.to;

        var from = new Date(parseInt(fromT));
        var to = new Date(parseInt(toT));

        var portal = await logstashUtils.getFileDB(id);
        var delay = req.params.delay

        res.json({
            'status': constants.REQUEST_REQUEST_OK,
            'message': 'OK'
        });
    } catch (error) {
        res.json({
            'status': constants.REQUEST_ERROR_INTERNAL_ERROR,
            'message': error
        });
    }

    if (portal.length > 0) {
        for (var date = from; date <= to; date.setDate(date.getDate() + 1)) {
            logger.info("Recargando dia - " + date);
            await elasticUtils.reloadPortal(portal[0], date, delay);
        }
    }
});

module.exports = router;
