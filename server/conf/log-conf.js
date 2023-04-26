'use strict'

var logConfig = {
    // customize the output format with multiple tags: timestamp, title, level, message, file 
    // pos, path, method, stack 
    // see the data object description for there meanings 
    format: '${timestamp} <${title}> ${file}:${line} ${method} ${message}',
    // every format according to Steven Levithan's excellent dateFormat() function is possible 
    dateformat: 'isoDateTime',
    // manipulate the data object before any transport 
    preprocess: function (data) {
    },
    // define one or multiple transports by the use of the data object (see the example mulitpleTransport.js) 
    transport: function (data) {
    },
    // can be an array of color strings or functions 
    // node.js colors: black, red, green, yellow, blue, magenta, cyan and white 
    // browser colors: any css color 
    // the last item can be a custom filter object where each method can be overridden indiviually 
    // see the filter example in the example directory for some usage 
    filters: [],
    // set the initial level, no transports are set for levels below the initial settings for performance reasons  
    // the level can be changed later on, but there is no log output if there are no transports set initially 
    level: 'debug',
    // the default levels according to RFC 5424, but you can set your own, e.g. ['log', 'info', 'error'] 
    methods: ['debug', 'info', 'notice', 'warning', 'error', 'critical', 'alert', 'emergency'],
    // get the specified index of stack as file information 
    stackIndex: 0,
    // with the options path, filename, filenameDateFormat and pathFormat 
    // one can control the filename and and its containing directory 
    // with the use of filenameDateFormat one can control the rotation period 
    // of new log files.
    // e.g. the format yyyymmdd will generate every day a new file, 
    // the format yyyymmdd_HH will generate 
    // every hour a new file and so on. 
    path: '/data/logs/aod-home/',
    filename: 'aod-api',
    filenameDateFormat: 'yyyymmdd',
    pathFormat: '${path}/${filename}_${filenameDateFormat}.log',
    // set the line ending deliminater for all logging messages 
    lineEnding: '\r\n'
};

module.exports = {
    getLogSettings: function () {
        return logConfig;
    }
};
