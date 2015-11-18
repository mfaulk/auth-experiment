'use strict';

var assert = require('assert');
var httpMocks = require('node-mocks-http');
var _ = require('lodash');

// TODO: should use models dedicated for these tests
var db = require('../../models');
console.log(db.sequelize);
var options = {};

var Router = require('./router');
var router = new Router(db.sequelize, options);


// splitPath ==================================================================

describe('splitPath on /api', function() {
  it('should respond with empty array', function() {
    var path = '/api';
    var parts = router.splitPath(path);
    assert.deepEqual(parts, []);
  });
});

describe('splitPath on /api/foo', function() {
  it('should respond with [foo]', function() {
    var path = '/api/foo';
    var parts = router.splitPath(path);
    assert.deepEqual(parts, ['foo']);
  });
});

describe('splitPath on /api/foo/1234', function() {
  it('should respond with [foo, 1234]', function() {
    var path = '/api/foo/1234';
    var parts = router.splitPath(path);
    assert.deepEqual(parts, ['foo', '1234']);
  });
});

describe('splitPath on /api/foo/1234/bar', function() {
  it('should respond with [foo, 1234, bar]', function() {
    var path = '/api/foo/1234/bar';
    var parts = router.splitPath(path);
    assert.deepEqual(parts, ['foo', '1234', 'bar']);
  });
});

describe('splitPath on /api/foo/1234/bar/0987', function() {
  it('should respond with [foo, 1234, bar, 0987]', function() {
    var path = '/api/foo/1234/bar/0987';
    var parts = router.splitPath(path);
    assert.deepEqual(parts, ['foo', '1234', 'bar', '0987']);
  });
});

// handleRequest ==============================================================

describe('router', function(){

  var request = httpMocks.createRequest({
    method: 'GET',
    url: '/api'
  });

  //var response = httpMocks.createResponse();

  var callback = function(obj) {
    var data = obj.data;
    var status = obj.status;

    var models = [];
    for(var i=0; i< data.length; i++) {
      models.push(data[i].name);
    }
    assert.equal(obj.status, 'success');
    assert(_.includes(models, 'User'));
  };

  it('should list models.', function(){
    router.handleRequest(request, callback);
  });
});

