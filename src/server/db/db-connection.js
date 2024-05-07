const { Pool } = require('pg');
const config = require('../conf/db-conf');
const ckanConfig = require('../conf/db-ckan-conf');

const pgPool = new Pool(config.getDatabaseConnectionSettings());
const pgCkanPool = new Pool(ckanConfig.getDatabaseConnectionSettings());

module.exports = {
    getPool: function () {
        if (pgPool) {
            return pgPool;
        }
        return pgPool;
    }
    ,
    getCkanPool: function () {
        if (pgCkanPool) {
            return pgCkanPool;
        }
        return pgCkanPool;
    }
};
