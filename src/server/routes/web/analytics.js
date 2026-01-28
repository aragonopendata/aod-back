const express = require('express');
const router = express.Router();
const constants = require('../../util/constants');
const logstashUtils = require('../../util/logstash');

/** GET ALL LOGSTASH CONFIG */
router.get('/analytics/files', function (req, res) {
    try {
        logstashUtils.getAllFilesEnabledDB().then(files => {
            res.json({
                'status': constants.REQUEST_REQUEST_OK,
                'message': files
            });
        }).catch(error => {
            throw error;
        });
    } catch (error) {
        res.json({
            'status': constants.REQUEST_ERROR_INTERNAL_ERROR,
            'message': error
        })
    }
});


module.exports = router;