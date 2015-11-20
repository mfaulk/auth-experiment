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

  // Sync, and populate testing DB
  sequelize.sync({force: true}).then(function () {

    User.create({
      firstName: 'Svetlana',
      lastName: 'Alexievich'
    });

    User.create({
      firstName: 'Patrick',
      lastName: 'Modiano'
    });

    User.create({
      firstName: 'Alice',
      lastName: 'Munro'
    });

    User.create({
      firstName: 'Mo',
      lastName: 'Yan'
    });

    User.create({
      firstName: 'Tomas',
      lastName: 'Transtromer' //robots in disguise
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
      allowNull: false
      //field: 'first_name' // Will result in an attribute that is firstName when user facing but first_name in the database
    },
    lastName: {
      type: Sequelize.STRING,
      allowNull: false
    }
  }, {
    timestamps: false,
    freezeTableName: true // Model tableName will be the same as the model name
  });
}

//User.sync({force: true}).then(function () {
//  // Table created
//  return User.create({
//    firstName: 'John',
//    lastName: 'Hancock'
//  });
//});
