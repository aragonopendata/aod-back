const express = require('express');
const router = express.Router();
const constants = require('../../util/constants');
const http = require('http');
//Multer for receive form-data
const multer = require('multer')
var storage = multer.memoryStorage()
var upload = multer({ storage: storage })
// FormData for send form-data
const formData = require('form-data');
const fs = require('fs');
//DB SETTINGS
const db = require('../../db/db-connection');
const pool = db.getPool();
//LOG SETTINGS
const logConfig = require('../../conf/log-conf');
const loggerSettings = logConfig.getLogSettings();
const logger = require('js-logging').dailyFile([loggerSettings]);

//Get file
router.get('/sysadmin', function (req, res, next) {
    try {
        var d = new Date();
        var logTxt = "";
        response = [];
        if(d.getMinutes() < 10){
            d = new Date(d.setHours(d.getHours() - 1));
        }
        
        fs.readFile(constants.SPIDER_LOG_PATH, function (err, data) {
            if (err) {
                return console.log(err);
            }
            logTxt = data.toString('utf8');
            lines = logTxt.split("\n");
            lines.forEach(line => {
                lineDate = new Date(line.split("\t")[0].substr(1, line.split("\t")[0].length - 2));
                if (getValidLogLine(lineDate, d) && line.split("\t")[1].toString() == "FULL") {
                    var status = "";
                    if (line.split("\t")[4].toString().includes("NOK")) {
                        status = "ERROR";
                    } else {
                        status = "OK";
                    }

                    response.push({
                        "date": lineDate.toLocaleString(),
                        "service": line.split("\t")[2].toString(),
                        "status": status}
                    );
                }
            });
            Promise.all(lines)
            .then((result) => res.send(response))
            .catch((err) => res.send(err));
        });
    } catch(error) {
        return console.log(error);
    }
});

function getValidLogLine(lineDate, executionDate) {
    var isInRange = false;
    if (lineDate.getDay() == executionDate.getDay() &&
        lineDate.toLocaleDateString() == executionDate.toLocaleDateString()) {
        isInRange = true;
    }
    return isInRange;
}

//Get flag
router.get('/sysadmin/emailRevision', function (req, res, next) {
    try {
        fs.readFile(constants.SPIDER_EMAIL_REVISION_PATH, function (err, data) {
            if (err) {
                return console.log(err);
            }
            emailRevision = data.toString('utf8');
            res.send(emailRevision);
        });
    } catch(error) {
        return console.log(error);
    }
});

//Change flag
router.put('/sysadmin/emailRevision', function (req, res, next) {
    try {
        var emailRevision = req.body["emailRevision"];
        if (emailRevision) {
            var jsonEmailRevision = {emailRevision: 0};
            fs.writeFile(constants.SPIDER_EMAIL_REVISION_PATH, JSON.stringify(jsonEmailRevision), function (err, data) {
                if (err) {
                    return console.log(err);
                }
                var successJson = { 
                    'status': constants.REQUEST_REQUEST_OK, 
                    'success': true,
                    'result':'INFORME REVISADO - Informe revisado correctamente'
                };
                res.send(successJson);
            });
        }
    } catch(error) {
        return console.log(error);
    }
});

module.exports = router;