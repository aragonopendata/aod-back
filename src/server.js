// DEPENDENCIES
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const constants = require('./server/util/constants');
const session = require('express-session');

//CORS USE
const corsHeaders = require('./server/conf/cors-headers');
//LOG SETTINGS
const logger = require("./server/conf/logger");

// API ROUTES
const datasets = require('./server/routes/web/datasets');
const tags = require('./server/routes/web/tags');
const topics = require('./server/routes/web/topics');
const organizations = require('./server/routes/web/organizations');
const contents = require('./server/routes/web/contents');
const campus = require('./server/routes/web/campus');
const focus = require('./server/routes/web/focus');
const focusAdmin = require('./server/routes/admin/focus');
const usersAdmin = require('./server/routes/admin/users');
const rolesAdmin = require('./server/routes/admin/roles');
const contentsAdmin = require('./server/routes/admin/contents');
const datasetsAdmin = require('./server/routes/admin/datasets');
const topicsAdmin = require('./server/routes/admin/topics');
const tagsAdmin = require('./server/routes/admin/tags');
const organizationsAdmin = require('./server/routes/admin/organizations');
const aodCore = require('./server/routes/admin/aod-core')
const logstash = require('./server/routes/admin/analytics')
const analytics = require('./server/routes/web/analytics')
const campusAdmin = require('./server/routes/admin/campus');
const sysAdmin = require('./server/routes/admin/sys-admin');
const mailer = require('./server/routes/web/mailer');

// API ROUTES 
const authenticate = require('./server/routes/authenticate');
const verifyToken = require('./server/util/verifyToken');

// EXPRESS APP
const app = express();
// Cors Response headers
app.use(corsHeaders.permission);
// Parsers for POST data
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Point static path to dist
app.use(express.static(path.join(__dirname, 'client')));

app.get('/', function (req, res) {
    res.redirect(constants.EXPRESS_NODE_REDIRECT_ROUTING_URL);
});

// Control Session
app.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true,
    cookie: { secure: true }
}));

// Set our api routes
app.use(constants.API_BASE_URL_SECURITY, authenticate);
app.use(constants.API_BASE_URL_WEB, datasets);
app.use(constants.API_BASE_URL_WEB, tags);
app.use(constants.API_BASE_URL_WEB, topics);
app.use(constants.API_BASE_URL_WEB, organizations);
app.use(constants.API_BASE_URL_WEB, contents);
app.use(constants.API_BASE_URL_WEB, campus);
app.use(constants.API_BASE_URL_WEB, analytics);
app.use(constants.API_BASE_URL_ADMIN, verifyToken, usersAdmin);
app.use(constants.API_BASE_URL_ADMIN, rolesAdmin);
app.use(constants.API_BASE_URL_ADMIN, contentsAdmin);
app.use(constants.API_BASE_URL_ADMIN, verifyToken, campusAdmin);
app.use(constants.API_BASE_URL_ADMIN, verifyToken, datasetsAdmin);
app.use(constants.API_BASE_URL_ADMIN, verifyToken, tagsAdmin);
app.use(constants.API_BASE_URL_ADMIN, topicsAdmin);
app.use(constants.API_BASE_URL_ADMIN, verifyToken, organizationsAdmin);
app.use(constants.API_BASE_URL_ADMIN, aodCore);
app.use(constants.API_BASE_URL_ADMIN, verifyToken, logstash);
//app.use('/api/admin', campusAdmin);
app.use(constants.API_BASE_URL_ADMIN, verifyToken, sysAdmin);
app.use(constants.API_BASE_URL_WEB, mailer);

app.use(constants.API_BASE_URL_WEB, focus);
app.use(constants.API_BASE_URL_ADMIN, verifyToken, focusAdmin);

// PORT FROM ENVIRONMENT
const port = process.env.PORT || constants.EXPRESS_NODE_STARTING_PORT;
app.set('port', port);

// CREATE HTTP SERVER
// const server = http.createServer(app);

// SERVER LISTENING.
app.listen(port,'0.0.0.0', function () {
    logger.info('Server started on port ' + port);
})

module.exports = app;