'use strict';

/**
 *
 * @param db - sequelize
 * @param config
 * @returns {{setPermissions: setPermissions}}
 */
module.exports = function (db, config) {

  config = config || {
      userIdField: 'user.dataValues.id',
      permissionsField: 'session.user.permissions'
    };

  /**
   * Assigns a nested field in an object, creating intermediate objects if necessary.
   * @param base - an object
   * @param path - the 'bar.baz' in 'foo.bar.baz'
   * @param value - a value to assign to foo.bar.baz
   * @returns {*} the modified object
   */
  function setNestedField(base, path, value) {
    var names = path.split('.');
    // If a value is given, remove the last name and keep it for later:
    var lastName = arguments.length === 3 ? names.pop() : false;
    // Walk the hierarchy, creating new objects where needed.
    // If the lastName was removed, then the last object is not set yet:
    for (var i = 0; i < names.length; i++) {
      base = base[names[i]] = base[names[i]] || {};
    }
    // If a value was given, set it to the last name:
    if (lastName) base = base[lastName] = value;
    // Return the last object in the hierarchy:
    return base;
  }

  function getNestedField(base, path) {
    var names = path.split('.');
    for (var i = 0; i < names.length; i++) {
      base = base[names[i]];
    }
    return base;
  }

  /**
   * Reads permissions set by passportjs, and writes them to req.session.user.permissions, as expected by express-authorization
   * @param req
   * @param res
   * @param next
   */
  function setPermissions(req, res, next) {
    var id = getNestedField(req, config.userIdField);
    db.User.find({where: {id: id}}).then(function (user) {
      console.log('permittivity:setPermissions using hard-coded permissions');
      var permissions = ["restricted:*"];
      setNestedField(req, config.permissionsField, permissions);
      next();
    }).error(function (err) {
      // TODO: error handling
    });
  }

  return {
    setPermissions: setPermissions
  }
};