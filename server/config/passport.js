'use strict';

var LocalStrategy = require('passport-local').Strategy;

module.exports = function (passport, db) {
  console.log('Configuring Passport');
  console.log(db.User);

  // Sessions =================================================================
  //
  // Passport will maintain persistent login sessions. In order for persistent sessions to work, the authenticated user
  // must be serialized to the session, and deserialized when subsequent requests are made.

  passport.serializeUser(function (user, done) {
    console.log('serializeUser: ', user.id);
    done(null, user.id);
  });

  passport.deserializeUser(function (id, done) {
    console.log('deserializeUser: ', id);
    db.User.find({where: {id: id}}).then(function (user) {
      done(null, user);
    }).error(function (err) {
      done(err, null);
    });
  });

  // Strategy =================================================================

  /**
   * Verify callback for LocalStrategy. If authentication succeeds, the next handler will be invoked and the req.user
   * property will be set to the authenticated user passed to the done callback.
   * @param username - value of the `usernameField`, default `username`, in the POST body.
   * @param password - value of the `passwordField`, default `password`, in the POST body.
   * @param done - callback, done(err,user). If the credentials are not valid (for example, if the password is incorrect),
   *      done should be invoked with false instead of a user to indicate an authentication failure. Err indicates a server failure.
   */
  function verify(username, password, done) {
    db.User.findOne({where: {username: username}}).then(function (user) {
      if (!user) {
        done(null, false, {message: 'Unknown user'});
      } else if (password != user.password) {
        done(null, false, {message: 'LocalStrategy: Invalid password'});
      } else {
        done(null, user);
      }
    }).error(function (err) {
      done(err);
    });
  }

  var options = {
    //usernameField: 'username',
    //passwordField: 'password',
    //passReqToCallback: true,
    //session: false
  };

  // This strategy has a default name of 'local'
  passport.use(new LocalStrategy(options, verify));
};