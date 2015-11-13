/**
 * Main application routes
 */

'use strict';

var errors = require('./components/errors');
var path = require('path');

module.exports = function (app, passport) {

  // Insert routes below

  // See http://stackoverflow.com/questions/15711127/express-passport-node-js-error-handling

  app.get('/api/loggedin', function(req, res){
    res.send(req.isAuthenticated() ? req.user : '0');
  });

  app.post('/api/login', passport.authenticate('local'), function(req, res){
    console.log('login succeeded.');
    console.log(req.user);
    res.send(req.user);
  });

  app.get('/api/logout', function (req, res) {
    req.logOut(); // provided by passport
    res.send(200);
  });

  app.use('/api/things', isAuthenticated, require('./api/thing')); // sample "private" route

  // All undefined asset or api routes should return a 404
  app.route('/:url(api|auth|components|app|bower_components|assets)/*')
    .get(errors[404]);

  // All other routes should redirect to the index.html
  app.route('/*')
    .get(function (req, res) {
      res.sendFile(path.resolve(app.get('appPath') + '/index.html'));
    });
};

// route middleware to make sure a user is logged in.
function isAuthenticated(req, res, next) {
  // isAuthenticated in defined in passport's request.js, https://github.com/jaredhanson/passport/blob/master/lib/http/request.js
  if (req.isAuthenticated()) {
    return next();
  }
  // See http://stackoverflow.com/questions/3297048/403-forbidden-vs-401-unauthorized-http-responses
  // for the differences between 401 Unauthorized and 403 Forbidden
  errors[401](req, res);
}
