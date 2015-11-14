/**
 * Main application file
 */

'use strict';

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
var config = require('./config/environment');

var express = require('express');
var app = express();
var server = require('http').createServer(app);
require('./config/express')(app);


// database ===================================================================
var db = require('./models');
//console.log(db.sequelize.models.User);
//db.sequelize.sync().then(function () {
//  console.log('sunk');
//});


// authentication =============================================================
var cookieParser = require('cookie-parser');
app.use(cookieParser());

var session = require('express-session');
app.use(session({secret: 'Fidelio', resave: true, saveUninitialized: true}));

var passport = require('passport');
require('./config/passport')(passport, db);
app.use(passport.initialize());
app.use(passport.session()); // for persistent login sessions

// authorization ==============================================================
var authorization = require('express-authorization');

// routes =====================================================================
require('./routes')(app, passport, authorization);


// launch =====================================================================
server.listen(config.port, config.ip, function () {
  console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
});

// Expose app
// var exports = module.exports = app;
