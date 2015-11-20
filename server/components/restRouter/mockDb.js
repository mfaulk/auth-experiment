'use strict';

var Sequelize = require('Sequelize');
var q = require('q');

/**
 *
 * @returns {*} promise of a sequelize instance.
 */
function getInMemorySequelize() {
  var deferred = q.defer();

  var sequelize = new Sequelize('database', 'username', 'password', {
    dialect: 'sqlite',
    // default storage is in-memory
    // storage: __dirname + '/database.sqlite'
  });

  console.log('Creating an in-memory SQLite database with test data...');

  // Define models
  var User = defineUser(sequelize);
  var Company = defineCompany(sequelize);
  User.belongsTo(Company);

  // Sync, and populate testing DB
  sequelize.sync({force: true}).then(function () {

    var universalExports, virtucon;

    Company.create({
      name: 'Universal Exports',
      isEvilShellCorp: false
    }).then(function (instance) {
      universalExports = instance;
    });

    Company.create({
      name: 'Virtucon Industries',
      isEvilShellCorp: true
    }).then(function (instance) {
      virtucon = instance;
    });

    User.create({
      firstName: 'Svetlana',
      lastName: 'Alexievich'
    }).then(function (instance) {
      instance.setCompany(virtucon);
    });

    User.create({
      firstName: 'Patrick',
      lastName: 'Modiano'
    }).then(function (instance) {
      instance.setCompany(universalExports);
    });

    User.create({
      firstName: 'Alice',
      lastName: 'Munro'
    }).then(function (instance) {
      instance.setCompany(virtucon);
    });

    User.create({
      firstName: 'Mo',
      lastName: 'Yan'
    }).then(function (instance) {
      instance.setCompany(virtucon);
    });

    User.create({
      firstName: 'Tomas',
      lastName: 'Transtromer'
    }).then(function (instance) {
      instance.setCompany(universalExports);
    });

    return deferred.resolve(sequelize);
  });

  return deferred.promise;
}

module.exports = {
  getSequelize: getInMemorySequelize
};

// Models =====================================================================

function defineUser(sequelize) {
  return sequelize.define('User', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER
    },
    firstName: {
      type: Sequelize.STRING,
      allowNull: false,
      field: 'first_name' // Will result in an attribute that is firstName when user facing but first_name in the database
    },
    lastName: {
      type: Sequelize.STRING,
      allowNull: false,
      field: 'last_name'
    }
  }, {
    timestamps: false,
    freezeTableName: true // Model tableName will be the same as the model name
  });
}

function defineCompany(sequelize) {
  return sequelize.define('Company', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    isEvilShellCorp: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      field: 'is_evil_shell_corp'
    }
  }, {
    timestamps: false,
    freezeTableName: true // Model tableName will be the same as the model name
  });
}

