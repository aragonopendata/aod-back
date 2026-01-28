'use strict'

const url = require('url');
const httpProxy = require('http-proxy-agent');
const constants = require('../util/constants');

module.exports = {
    getproxyOptions: function (requestPath) {
        var proxyUser = constants.PROXY_USER;
        var proxyPass = constants.PROXY_PASS;
        var proxyUrl = constants.PROXY_URL;
        var proxyPort = constants.PROXY_PORT;
        var proxyRequestUrl = 'http://' + proxyUser + ':' + proxyPass 
                            + '@' + proxyUrl + ':' + proxyPort + '/';
        var proxyConf = process.env.http_proxy || proxyRequestUrl;
        var endpoint = process.argv[2] || requestPath;
        var proxyAgent = new httpProxy(proxyConf);
        var options = url.parse(endpoint);
        options.agent = proxyAgent;
        return options;
    }
}
