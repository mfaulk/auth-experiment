'use strict';

/**
 * Derived from https://github.com/pjanaya/sequelize-restful-extended/blob/master/lib/router.js, and modified for use
 * with sequelize ^3.13.0
 */

var _ = require('lodash');
var querystring = require('querystring');
var url = require('url');

var Router = module.exports = function (db, options) {
  this.db = db;
  this.sequelize = db.sequelize;
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

  if (!this.isRestfulRequest(req.path)) {
    this.handleError('Route does not belong to this API.', callback);
    return;
  }

  var match = this.splitPath(req.path);
  var modelName = match[0];
  var identifier = match[1];
  // If present, identifier and associatedIdentifier must be numbers.
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

    /*
     * requested path: /api/model_name
     */
    case 1:
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

    /*
     *requested path: /api/model_name/1
     */
    case 2:
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

    /*
     * requested path: /api/model_name/1/associated_model_name
     */
    case 3: //
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

    /*
     * requested path: /api/dao_factory/1/associated_dao_factory/1
     */
    case 4:
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
  // TODO: this should return meaningful HTTP error codes.
  callback({
    status: 'error',
    message: msg
  });
};

Router.prototype.handleSuccess = function (data, optionsOrCallback, callback) {
  if (typeof optionsOrCallback === 'function') {
    callback = optionsOrCallback;
    optionsOrCallback = {};
  }

  if (!!data.count) {
    callback({
      status: 'success',
      count: data.count,
      data: _.map(data.rows, function (row) {
        return row.toJSON();
      })
    }, optionsOrCallback);
  } else {
    callback({
      status: 'success',
      data: data
    }, optionsOrCallback);
  }
};

//Router.prototype.findAssociation = function (daoFactory, associatedModelName) {
//  for (var key in  daoFactory.associations) {
//    var hasAssociationAccessor = (daoFactory.associations[key].associationAccessor === associatedModelName);
//    var hasTargetTableName = (daoFactory.associations[key].target.tableName === associatedModelName);
//
//    if (hasAssociationAccessor || hasTargetTableName) {
//      return daoFactory.associations[key];
//    }
//  }
//  return null;
//};
//
//Router.prototype.findSingleAssociatedModel = function (modelName, identifier, associatedModelName, callback) {
//  var daoFactory = this.findDAOFactory(modelName);
//  var association = !!daoFactory ? this.findAssociation(daoFactory, associatedModelName) : null;
//
//  if (association.associationType !== 'BelongsTo') {
//    association = null;
//  }
//
//  if (!!association) {
//    daoFactory.find(identifier).done(function (err, dao) {
//      if (err) {
//        callback(err, null);
//      } else {
//        dao[association.accessors.get]().success(function (associatedModel) {
//          callback(null, associatedModel);
//        })
//      }
//    })
//  } else {
//    callback(new Error('Unable to find ' + modelName + ' with identifier ' + identifier), null);
//  }
//};

/**
 *
 * @param modelName
 * @returns {boolean}
 */
Router.prototype.isAllowed = function (modelName) {
  // check if modelName is an actual model
  var modelExists = _.includes(_.keys(this.db.sequelize.models).map(function (val) {
    return val.toLowerCase();
  }), modelName.toLowerCase());
  if (!modelExists) {
    return false;
  }

  if (this.options.allowed.length > 0) {
    return (this.options.allowed.indexOf(modelName) !== -1);
  } else {
    return true;
  }
};

/**
 *
 */
var getModel = function (modelName, db) {
  //console.log(db.models);
  //Object.keys(db.models).forEach(function (name) {
  //  if(modelName.toUpperCase() === name.toUpperCase()) {
  //    return db.models[name];
  //  }
  //});
  var modelNames = _.keys(db.sequelize.models);
  for (var i = 0; i < modelNames.length; i++) {
    if (modelNames[i].toLowerCase() === modelName.toLowerCase()) {
      return db.sequelize.models[modelNames[i]];
    }
  }
  return new Error();
};

/**
 * Handle GET /api
 * @param callback
 */
var handleIndex = function (callback) {
  var modelNames = [];
  for (var property in this.sequelize.models) {
    if (this.sequelize.models.hasOwnProperty(property)) {
    }
    modelNames.push(property);
  }
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


/**
 * Handle HTTP GET /api/model
 * @param modelName
 * @param query
 * @param callback
 */
var handleResourceIndex = function (modelName, query, callback) {
  console.log('router:handleResourceIndex:', modelName);

  /////////////// ADDITIONAL QUERY PARAMETERS ///////////////////////
  if (!!query) {
    var queryStringify = JSON.stringify(query);
    var jsonQuery = JSON.parse(queryStringify);
    console.log(jsonQuery);

    var sort = '';
    var limit = '';
    var offset = '';

    if (!!jsonQuery.sort) { // Sorting
      sort = jsonQuery.sort;
      if (sort[0] == "-") {
        sort = sort.substr(1);
        sort = sort + " DESC";
      }
      delete jsonQuery["sort"];
    }

    if (!!jsonQuery.limit) { // Limiting
      limit = jsonQuery.limit;
      delete jsonQuery["limit"];
    }

    if (!!jsonQuery.offset) { // Offset
      offset = jsonQuery.offset;
      delete jsonQuery["offset"];
    }

    var ranges = [];
    var likeFields = [];

    for (var key in jsonQuery) { //loop through the keys
      if (key.indexOf("_start") > -1) {
        var fieldName = key.split("_start")[0];
        if (!!jsonQuery[fieldName + "_end"]) {
          ranges.push({
            field_name: fieldName,
            start_field_name: key,
            start_field_value: jsonQuery[key],
            end_field_name: fieldName + "_end",
            end_field_value: jsonQuery[fieldName + "_end"]
          });
        }
      } else {
        if (key.indexOf("_like") > -1) {
          var fieldName = key.split("_like")[0];
          likeFields.push({
            field_name: fieldName,
            field_value: jsonQuery[key]
          });
        }
      }
    }

    if (likeFields.length > 0) {
      for (var i = 0; i < likeFields.length; i++) {
        delete jsonQuery[likeFields[i].field_name + '_like'];
        jsonQuery[likeFields[i].field_name] = {
          like: '%' + likeFields[i].field_value + '%'
        };
      }
    }

    if (ranges.length > 0) {
      for (var i = 0; i < ranges.length; i++) {
        var range = ranges[i];

        delete jsonQuery[range.start_field_name];
        delete jsonQuery[range.end_field_name];

        var fieldName = range.field_name;
        var startValue = range.start_field_value;
        var endValue = range.end_field_value;

        jsonQuery[fieldName] = {
          gt: startValue,
          lt: endValue
        };
      }
    }
  }
  /////////////// ADDITIONAL QUERY PARAMETERS ///////////////////////

  var where = (!!query) ? {where: jsonQuery, order: sort, limit: limit, offset: offset} : {};
  var model = getModel(modelName, this.db);
  var that = this;
  model.findAndCountAll(where).then(function (items) {
    that.handleSuccess(items, callback);
  }).error(function (err) {
    // TODO: return meaningful http status code.
    that.handleError(err, callback);
  });
};

/**
 * Handle HEAD /api/model
 */
var handleResourceDescribe = function (modelName, callback) {
  // TODO: what should this return?
  var model = getModel(modelName, this.db);

  if (model) {
    this.handleSuccess({
      name: modelName,
      tableName: 'tableNameGoHere',
      attributes: 'rawAttributesGoHere'
    }, {
      viaHeaders: true
    }, callback);
  } else {
    this.handleError("Unknown Model: " + modelName, callback);
  }
};

// TODO: handleResourceCreate
/**
 * Handle POST /api/model
 * @param modelName
 * @param attributes
 * @param callback
 */
var handleResourceCreate = function(modelName, attributes, callback) {
  console.log('modelName: ', modelName);
  console.log('attributes: ', attributes);

  var model = getModel(modelName, this.db);

  // should return 201(Created), 404(Not Found), 409(Conflict)

  if (model) {
    var that = this;
    model
      .create(attributes)
      .then(function(entry) {
        if (!entry){
          console.log('no entry?');
          that.handleSuccess({}, callback)
        }else{
          that.handleSuccess(entry.dataValues, callback)
        }
      })
      .error(function(err) {
        that.handleError(err, callback)
      })
  } else {
    this.handleError("Unknown Model: " + modelName, callback)
  }
}

/**
 * Handle GET /api/model/id
 * @param modelName
 * @param identifier - integer id
 * @param callback
 */
var handleResourceShow = function (modelName, identifier, callback) {
  var model = getModel(modelName, this.db);
  var that = this;
  if (!model) {
    this.handleError("Unknown Model: " + modelName, callback)
  } else {
    model.find({where: {id: identifier}}).then(function (item) {
      if(!!item) {
        that.handleSuccess(item.dataValues, callback);
      } else {
        that.handleError('Invalid ID', callback);
      }
    }).error(function (err) {
      that.handleError(err,  callback);
    });
  }
};
