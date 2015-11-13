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
    console.log('serializeUser');
    done(null, user.id);
  });

  passport.deserializeUser(function (id, done) {
    console.log('deserializeUser');
    db.User.find({where: {id: id}}).then(function (user) {
      done(null, user);
    }).error(function (err) {
      done(err, null);
    });
  });

  // Strategy =================================================================

  // This strategy has a default name of 'local'
  passport.use(new LocalStrategy(
    function (username, password, done) {
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
  ));

};