'use strict';

var assert = require('assert');
var httpMocks = require('node-mocks-http');
var _ = require('lodash');
// TODO: should use models dedicated for these tests

//var db = require('../../models');
var Router = require('./router');
var mockDB = require('./mockDb');

//if(process.env.NODE_ENV === 'test' && db.sequelize.config.database === 'database_test') {
//  console.log('syncing');
//  db.sequelize.sync({
//    force: true
//  });
//}

//console.log(db.sequelize);


var sequelize, router;


// Before =====================================================================

beforeEach(function (done) {
  // Creating a mock DB can take time. Extend mocha's timeout.
  this.timeout(15000);
  mockDB.getSequelize().then(function (_sequelize) {
    var options = {};
    var db = {
      sequelize: _sequelize
    };
    sequelize = _sequelize;
    _.extend(db, _sequelize.models);
    router = new Router(db, options);
    done();
  });
});


// splitPath ==================================================================

describe('splitPath on /api', function () {
  it('should respond with empty array', function () {
    var path = '/api';
    var parts = router.splitPath(path);
    assert.deepEqual(parts, []);
  });
});

describe('splitPath on /api/foo', function () {
  it('should respond with [foo]', function () {
    var path = '/api/foo';
    var parts = router.splitPath(path);
    assert.deepEqual(parts, ['foo']);
  });
});

describe('splitPath on /api/foo/1234', function () {
  it('should respond with [foo, 1234]', function () {
    var path = '/api/foo/1234';
    var parts = router.splitPath(path);
    assert.deepEqual(parts, ['foo', '1234']);
  });
});

describe('splitPath on /api/foo/1234/bar', function () {
  it('should respond with [foo, 1234, bar]', function () {
    var path = '/api/foo/1234/bar';
    var parts = router.splitPath(path);
    assert.deepEqual(parts, ['foo', '1234', 'bar']);
  });
});

describe('splitPath on /api/foo/1234/bar/0987', function () {
  it('should respond with [foo, 1234, bar, 0987]', function () {
    var path = '/api/foo/1234/bar/0987';
    var parts = router.splitPath(path);
    assert.deepEqual(parts, ['foo', '1234', 'bar', '0987']);
  });
});

// handleRequest ==============================================================

describe('router', function () {
  it('should error if request is not below the endpoint.', function (done) {
    var request = httpMocks.createRequest({
      method: 'GET',
      url: '/thisisnottheapi'
    });
    var callback = function (obj) {
      assert.equal(obj.status, 'error');
      done();
    };
    router.handleRequest(request, callback);
  });
});


describe('router GET /api', function () {
  it('should list models.', function (done) {
    var request = httpMocks.createRequest({
      method: 'GET',
      url: '/api'
    });

    var callback = function (obj) {
      assert.equal(obj.status, 'success');
      var data = obj.data;
      var models = [];
      for (var i = 0; i < data.length; i++) {
        models.push(data[i].name);
      }
      assert(_.includes(models, 'User'));
      done();
    };

    router.handleRequest(request, callback);
  });
});

// /api/model

describe('router GET /api/user', function () {
  it('should list users.', function (done) {
    var request = httpMocks.createRequest({
      method: 'GET',
      url: '/api/user',
      params: {},
      query: {}
    });
    var callback = function (obj) {
      assert.equal(obj.status, 'success');
      assert.equal(obj.count, 5);
      assert.equal(obj.data.length, 5);
      done();
    };
    router.handleRequest(request, callback);
  });
});

describe('router GET /api/user?limit=3', function () {
  it('should list three users.', function (done) {
    var request = httpMocks.createRequest({
      method: 'GET',
      url: '/api/user',
      params: {},
      query: {limit: 3}
    });
    var callback = function (obj) {
      // limit should not affect the total count.
      assert.equal(obj.count, 5);
      assert.equal(obj.status, 'success');
      assert.equal(obj.data.length, 3);
      done();
    };
    router.handleRequest(request, callback);
  });
});

describe('router GET /api/user where firstname is Patrick', function () {
  it('should return user 2.', function (done) {
    var request = httpMocks.createRequest({
      method: 'GET',
      url: '/api/user',
      params: {},
      query: {firstName: 'Patrick'}
    });
    var callback = function (obj) {
      assert.equal(obj.status, 'success');
      assert.equal(obj.count, 1);
      assert.equal(obj.data.length, 1);
      var user = obj.data[0];
      assert.equal(user.firstName, 'Patrick');
      assert.equal(user.lastName, 'Modiano');
      done();
    };
    router.handleRequest(request, callback);
  });
});

describe('router GET /api/notamodel', function () {
  it('should give an error status.', function (done) {
    var request = httpMocks.createRequest({
      method: 'GET',
      url: '/api/notamodel',
      params: {},
      query: {}
    });
    var callback = function (obj) {
      // limit should not affect the total count.
      assert.equal(obj.status, 'error');
      done();
    };
    router.handleRequest(request, callback);
  });
});

describe('router HEAD /api/user', function () {
  it('should..?', function (done) {
    var request = httpMocks.createRequest({
      method: 'HEAD',
      url: '/api/user'
    });

    var callback = function (obj) {
      var data = obj.data;
      var status = obj.status;
      done();
    };

    router.handleRequest(request, callback);
  });
});

describe('router POST /api/user', function () {
  it('should return created user.', function (done) {
    var request = httpMocks.createRequest({
      method: 'POST',
      url: '/api/user',
      body: {
        firstName: 'Calvin',
        lastName: 'Broadus'
      }
    });

    var callback = function (obj) {
      var data = obj.data;
      assert(data.id);
      assert.equal(data.firstName, 'Calvin');
      assert.equal(data.lastName, 'Broadus');
      assert.equal(obj.status, 'success');
      sequelize.models.User.count().then(function (c) {
        assert.equal(c, 6);
        done();
      });
    };

    router.handleRequest(request, callback);
  });
});

// /api/model/id

describe('router GET /api/user/2', function () {
  it('should return JSON for user 2', function (done) {
    var request = httpMocks.createRequest({
      method: 'GET',
      url: '/api/user/2',
      params: {},
      query: {}
    });
    var callback = function (obj) {
      var user = obj.data;
      assert.equal(obj.status, 'success');
      assert.equal(user.id, 2);
      assert.equal(user.firstName, 'Patrick');
      assert.equal(user.lastName, 'Modiano');
      done();
    };
    router.handleRequest(request, callback);
  });
});

describe('router GET /api/user/id with invalid id', function () {
  it('should error', function (done) {
    var request = httpMocks.createRequest({
      method: 'GET',
      url: '/api/user/2908234098230948',
    });
    var callback = function (obj) {
      var user = obj.data;
      assert.equal(obj.status, 'error');
      done();
    };
    router.handleRequest(request, callback);
  });
});

describe('router PUT /api/user/3', function () {
  it('should return JSON for updated user.', function (done) {
    var request = httpMocks.createRequest({
      method: 'PUT',
      url: '/api/user/3',
      body: {
        firstName: 'Snoop',
        lastName: 'Dee-oh-double-gizzle'
      }
    });
    var callback = function (obj) {
      var user = obj.data;
      assert.equal(obj.status, 'success');
      assert.equal(user.id, 3);
      assert.equal(user.firstName, 'Snoop');
      assert.equal(user.lastName, 'Dee-oh-double-gizzle');
      done();
    };
    router.handleRequest(request, callback);
  });
});

describe('router DELETE /api/user/2', function () {
  it('should delete user 2.', function (done) {
    var request = httpMocks.createRequest({
      method: 'DELETE',
      url: '/api/user/2'
    });
    var callback = function (obj) {
      var user = obj.data;
      assert.equal(obj.status, 'success');

      sequelize.models.User.count().then(function (c) {
        assert.equal(c, 4);
        done();
      });

    };
    router.handleRequest(request, callback);
  });
});

//
//describe('router POST /api/user', function () {
//  it('should...', function () {
//    var request = httpMocks.createRequest({
//      method: 'POST',
//      url: '/api/user'
//    });
//
//    var callback = function (obj) {
//      //.log(obj);
//      var data = obj.data;
//      var status = obj.status;
//
//      //var models = [];
//      //for (var i = 0; i < data.length; i++) {
//      //  models.push(data[i].name);
//      //}
//      //assert.equal(status, 'success');
//      //assert(_.includes(models, 'User'));
//    };
//
//    router.handleRequest(request, callback);
//  });
//});

