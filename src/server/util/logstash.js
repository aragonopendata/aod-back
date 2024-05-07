const constants = require('./constants');
const dbQueries = require('../db/db-queries');
const fs = require('fs');
var path = require('path');
const Handlebars = require('handlebars');
const db = require('../db/db-connection');
const pool = db.getPool();

module.exports = {
    createPipeline: function (portal, id) {
        var logstashPath = constants.ANALYTICS_LOGSTASH_PATH;
        var templatePath = path.join(__dirname, '..', 'conf', 'analytics_templates');

        var pipelineTemplate;
        if (portal.type == 'urchin') {
            pipelineTemplate = fs.readFileSync(String(templatePath) + '/urchin_template_v2.conf');
        }
        if (portal.type == 'analytics_GA4') {
            pipelineTemplate = fs.readFileSync(String(templatePath) + '/analytics_template_v2.conf');
        }
        
        if (portal.type == 'analytics') {
            pipelineTemplate = fs.readFileSync(String(templatePath) + '/ga4_template.conf');
        }

        var compiledTemplate = Handlebars.compile(String(pipelineTemplate));

        var data = {
            "delay": String(portal.delay),
            "view": String(portal.view),
            "url": String(portal.url),
            "id": String(id),
            "eurl": constants.ANALYTICS_ELASTIC_URL,
        };

        var pipeline = compiledTemplate(data);

        if (!fs.existsSync(logstashPath + '/LogStashPipelines')) {
            fs.mkdirSync(logstashPath + '/LogStashPipelines');
        }

        fs.writeFileSync(logstashPath + '/LogStashPipelines/' + id + '.conf', pipeline);
    },

    deletePipeline: function (id) {
        var logstashPath = constants.ANALYTICS_LOGSTASH_PATH;
        var filePath = logstashPath + '/LogStashPipelines/' + id + '.conf';
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
        }
    },

    reloadPipelinesConf: function (portals) {
        var logstashPath = constants.ANALYTICS_LOGSTASH_PATH;
        var templatePath = path.join(__dirname, '..', 'conf', 'analytics_templates');

        var pipelineTemplate = fs.readFileSync(String(templatePath) + '/pipelines_template_v2.yml');

        var compiledTemplate = Handlebars.compile(String(pipelineTemplate));

        var data = {
            "logstashs": portals,
        };

        var pipeline = compiledTemplate(data);

        fs.writeFileSync(logstashPath + '/LogStashApp/config/pipelines.yml', pipeline);
    },

    insertLogstashDB: function (portal) {
        return new Promise((resolve, reject) => {
            try {
                var name = portal.portal_name;
                /*var type = portal.type;*/
                var type = "analytics_GA4";
                var view = portal.view;
                var delay = portal.delay;
                var url = portal.url;

                pool.connect((connError, client, done) => {

                    if (connError) {
                        reject(connError);
                    }

                    const queryDb = {
                        text: dbQueries.DB_ADMIN_INSERT_LOGSTASH,
                        values: [name, type, view, delay, url]
                    };
                    if (client) {
                        client.query(queryDb, (dberror, response) => {
                            done();
                            if (dberror) {
                                reject(dberror);
                            } else {
                                resolve(response.rows[0].id_logstash);
                            }
                        })
                    }
                })
            } catch (error) {
                reject(error);
            }
        });
    },

    updateLogstashDB: function (portal, id) {
        return new Promise((resolve, reject) => {
            try {
                var portal_name = portal.portal_name;

                var type = portal.type;
                var view = portal.view;
                var delay = portal.delay;
                var url = portal.url;

                pool.connect((connError, client, done) => {

                    if (connError) {
                        reject(connError);
                    }

                    const queryDb = {
                        text: dbQueries.DB_ADMIN_UPDATE_LOGSTASH,
                        values: [portal_name, type, view, delay, url, id]
                    };
                    if (client) {
                        client.query(queryDb, (dberror, response) => {
                            done();
                            if (dberror) {
                                reject(dberror);
                            } else {
                                resolve(response);
                            }
                        })
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    },

    deleteLogstashDB: function (id) {
        return new Promise((resolve, reject) => {
            try {
                pool.connect((connError, client, done) => {

                    if (connError) {
                        reject(connError)
                    }

                    const queryDb = {
                        text: dbQueries.DB_ADMIN_DELETE_LOGSTASH,
                        values: [id]
                    };
                    if (client) {
                        client.query(queryDb, (dberror, response) => {
                            done();
                            if (dberror) {
                                reject(dberror);
                            } else {
                                resolve(response);
                            }
                        })
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    },

    enableLogstashDB: function (id) {
        return new Promise((resolve, reject) => {
            try {
                pool.connect((connError, client, done) => {

                    if (connError) {
                        reject(connError)
                    }

                    const queryDb = {
                        text: dbQueries.DB_ADMIN_ENABLE_LOGSTASH,
                        values: [id]
                    };
                    if (client) {
                        client.query(queryDb, (dberror, response) => {
                            done();
                            if (dberror) {
                                reject(dberror);
                            } else {
                                resolve(response);
                            }
                        })
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    },

    disableLogstashDB: function (id) {
        return new Promise((resolve, reject) => {
            try {
                pool.connect((connError, client, done) => {

                    if (connError) {
                        reject(connError)
                    }

                    const queryDb = {
                        text: dbQueries.DB_ADMIN_DISABLE_LOGSTASH,
                        values: [id]
                    };
                    if (client) {
                        client.query(queryDb, (dberror, response) => {
                            done();
                            if (dberror) {
                                reject(dberror);
                            } else {
                                resolve(response);
                            }
                        })
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    },

    getAllFilesDB: function () {
        return new Promise((resolve, reject) => {
            try {
                pool.connect(function (err, client, done) {

                    if (err) {
                        reject(err)
                    }

                    const queryDb = {
                        text: dbQueries.DB_ADMIN_GETALL_LOGSTASH,
                        rowMode: constants.SQL_RESULSET_FORMAT_JSON
                    };
                    if (client) {
                        client.query(queryDb, (dberror, response) => {
                            done();
                            if (dberror) {
                                reject(dberror);
                            } else {
                                resolve(response.rows);
                            }
                        })
                    }
                })
            } catch (error) {
                reject(error)
            }
        })
    },

    getFileDB: function (id) {
        return new Promise((resolve, reject) => {
            try {
                pool.connect(function (err, client, done) {

                    if (err) {
                        reject(err)
                    }

                    const queryDb = {
                        text: dbQueries.DB_ADMIN_GET_LOGSTASH,
                        values: [id],
                        rowMode: constants.SQL_RESULSET_FORMAT_JSON
                    };
                    if (client) {
                        client.query(queryDb, (dberror, response) => {
                            done();
                            if (dberror) {
                                reject(dberror);
                            } else {
                                resolve(response.rows);
                            }
                        })
                    }
                })
            } catch (error) {
                reject(error)
            }
        })
    },

    getAllFilesEnabledDB: function () {
        return new Promise((resolve, reject) => {
            try {
                pool.connect(function (err, client, done) {

                    if (err) {
                        reject(err)
                    }

                    const queryDb = {
                        text: dbQueries.DB_ADMIN_GETENABLED_LOGSTASH,
                        rowMode: constants.SQL_RESULSET_FORMAT_JSON
                    };
                    if (client) {
                        client.query(queryDb, (dberror, response) => {
                            done();
                            if (dberror) {
                                reject(dberror);
                            } else {
                                resolve(response.rows);
                            }
                        })
                    }
                })
            } catch (error) {
                reject(error)
            }
        })
    }
};
