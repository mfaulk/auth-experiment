'use strict';

/**
 * Derived from https://github.com/pjanaya/sequelize-restful-extended/blob/master/lib/router.js
 */

var _ = require('lodash');
var querystring = require('querystring');

var Router = module.exports = function (sequelize, options) {
  this.sequelize = sequelize;
  this.options = _.extend({
    endpoint: '/api',
    logLevel: 'info',
    extendedMode: true,
    allowed: []
  }, options || {})
};

//Router.prototype.log = ...

Router.prototype.isRestfulRequest = function (path) {
  return path.indexOf(this.options.endpoint) === 0
};

/**
 * Splits an API
 * @param path - of form /api/dao_factory/1/associated_dao_factory/1, with optional parameters
 * @returns {Array}
 *
 * Examples:
 *
 * /api -> []
 * /api/dao_factory --> [dao_factory]
 * /api/dao_factory/1 --> [doa_factory, 1]
 * /api/dao_factory/1/associated_dao_factory --> [dao_factory, id, associated_dao_factory]
 * /api/dao_factory/1/associated_dao_factory/1 --> [dao_factory, id, associated_dao_factory, id]
 */
Router.prototype.splitPath = function (path) {
  var regex = new RegExp('^' + this.options.endpoint + '/?([^/]+)?/?([^/]+)?/?([^/]+)?/?([^/]+)?$');
  var match = path.match(regex);
  var rest_params = [];

  for (var i = 1; i < match.length; i++) {
    if (typeof match[i] !== 'undefined') {
      rest_params.push(match[i])
    }
  }
  return rest_params
};

Router.prototype.handleRequest = function (req, callback) {

  var match = this.splitPath(req.path);
  var modelName = match[0];
  var identifier = match[1];
  var associatedModelName = match[2];
  var associatedIdentifier = match[3];

  switch (match.length) {
    case 0: // requested path: /api

      if ((req.method === 'GET') && (req.path === this.options.endpoint)) {
        handleIndex.call(this, callback)
      } else {
        // TODO: use components/errors to return a 400?
        this.handleError('Route does not match known patterns.', callback)
      }
      break;

    case 1: // requested path: /api/model_name

      //modelName = match[0];

      if (this.isAllowed(modelName)) {
        switch (req.method) {
          case 'GET':
            handleResourceIndex.call(this, modelName, req.query, callback);
            break;
          case 'HEAD':
            handleResourceDescribe.call(this, modelName, callback);
            break;
          case 'POST':
            handleResourceCreate.call(this, modelName, req.body, callback);
            break;
          default:
            this.handleError('Method not available for this pattern.', callback);
            break;
        }
      } else {
        this.handleError('Route does not match known patterns.', callback);
      }

      break;
    case 2: // requested path: /api/model_name/1

      //modelName = match[0];
      //identifier = match[1];
      // identifier must be a number
      if (isNaN(parseInt(identifier)) || !this.isAllowed(modelName)) {
        this.handleError('Route does not match known patterns.', callback)
      } else {

        switch (req.method) {
          case 'GET':
            handleResourceShow.call(this, modelName, identifier, callback);
            break;
          case 'DELETE':
            handleResourceDelete.call(this, modelName, identifier, callback);
            break;
          case 'PUT':
            handleResourceUpdate.call(this, modelName, identifier, req.body, callback);
            break;
          default:
            this.handleError('Method not available for this pattern.', callback);
            break;
        }
      }

      break;
    case 3: // requested path: /api/model_name/1/associated_model_name

      //modelName = match[0];
      //identifier = match[1];
      //associatedModelName = match[2];
      // identifier must be a number
      if (isNaN(parseInt(identifier)) || !this.isAllowed(modelName) || !this.isAllowed(associatedModelName)) {
        this.handleError('Route does not match known patterns.', callback)
      } else {
        switch (req.method) {
          case 'GET':
            handleResourceIndexAssociation.call(this, modelName, identifier, associatedModelName, callback);
            break;
          case 'DELETE':
            // Search for a 1:1 / N:1 association. If it exists, we can dereference the target.
            // Otherwise we will raise an error.
            this.findSingleAssociatedModel(modelName, identifier, associatedModelName, function (err, associatedModel) {
              if (!!associatedModel) {
                handleResourceDeleteAssociation.call(this, modelName, identifier, associatedModelName, associatedModel.id, callback);
              } else {
                this.handleError('Method not available for this pattern.', callback);
              }
            }.bind(this));

            break;
          // Add more handlers for others methods
          default:
            this.handleError('Method not available for this pattern.', callback);
            break;
        }
      }

      break;
    case 4: // requested path: /api/dao_factory/1/associated_dao_factory/1

      //var modelName = match[0]
      //var identifier = match[1]
      //var associatedModelName = match[2]
      //var associatedIdentifier = match[3]
      // identifier and associatedIdentifier must be numbers
      if (isNaN(parseInt(identifier)) || isNaN(parseInt(associatedIdentifier)) || !this.isAllowed(modelName) || !this.isAllowed(associatedModelName)) {
        this.handleError('Route does not match known patterns.', callback);
      } else {

        switch (req.method) {
          case 'DELETE':
            handleResourceDeleteAssociation.call(this, modelName, identifier, associatedModelName, associatedIdentifier, callback);
            break;
          // Add more handlers for others methods
          default:
            this.handleError('Method not available for this pattern.', callback);
            break;
        }

      }
      break;
    default:
      this.handleError('Route does not match known patterns.', callback);
      break
  }
};

Router.prototype.handleError = function (msg, callback) {
  callback({
    status: 'error',
    message: msg
  });
};

Router.prototype.handleSuccess = function (data, optionsOrCallback, callback) {
  //console.log('router:handleSuccess');
  if (typeof optionsOrCallback === 'function') {
    callback = optionsOrCallback;
    optionsOrCallback = {};
  }

  if (!!data.count) {
    callback({
      status: 'success',
      count: data.count,
      data: data.rows
    }, optionsOrCallback)
  } else {
    callback({
      status: 'success',
      data: data
    }, optionsOrCallback)
  }
};

Router.prototype.findDAOFactory = function (modelName) {
  return this.sequelize.daoFactoryManager.getDAO(modelName, {attribute: 'tableName'});
};

Router.prototype.findAssociation = function (daoFactory, associatedModelName) {
  for (var key in  daoFactory.associations) {
    var hasAssociationAccessor = (daoFactory.associations[key].associationAccessor === associatedModelName);
    var hasTargetTableName = (daoFactory.associations[key].target.tableName === associatedModelName);

    if (hasAssociationAccessor || hasTargetTableName) {
      return daoFactory.associations[key];
    }
  }
  return null;
};

Router.prototype.findSingleAssociatedModel = function (modelName, identifier, associatedModelName, callback) {
  var daoFactory = this.findDAOFactory(modelName);
  var association = !!daoFactory ? this.findAssociation(daoFactory, associatedModelName) : null;

  if (association.associationType !== 'BelongsTo') {
    association = null;
  }

  if (!!association) {
    daoFactory.find(identifier).done(function (err, dao) {
      if (err) {
        callback(err, null);
      } else {
        dao[association.accessors.get]().success(function (associatedModel) {
          callback(null, associatedModel);
        })
      }
    })
  } else {
    callback(new Error('Unable to find ' + modelName + ' with identifier ' + identifier), null);
  }
};

Router.prototype.isAllowed = function (modelName) {
  if (this.options.allowed.length > 0) {
    return (this.options.allowed.indexOf(modelName) !== -1);
  } else {
    return true;
  }
};

var handleIndex = function (callback) {
  //console.log('router:handleIndex');

  var modelNames = [];

  for(var property in this.sequelize.models) {
    if(this.sequelize.models.hasOwnProperty(property)) {}
    modelNames.push(property);
  }

  //var daos = this.sequelize.daoFactoryManager.daos;

  var result = modelNames.map(function (modelName) {
    return {
      name: modelName
    }
  });

  if (this.options.allowed.length > 0) {
    var allowed = this.options.allowed;
    result = result.filter(function (element) {
      return (allowed.indexOf(element.tableName) !== -1)
    });
  }

  this.handleSuccess(result, callback);
};

