'use strict';

angular.module('authWithNodeApp')
  .controller('MainCtrl', function ($scope, $http) {
    var vm = this;
    activate();

    function activate() {
      // Initialize the view-model here.

      $http.get('/api/thingswithauthentication/').then(function (response) {
        console.log('got things with authentication');
        console.log(response);

        // should be able to get these
        $http.get('/api/restricted').then(function (response) {
          console.log('got things with restricted:view permission');
        }, function (response) {
          console.log('something went wrong');
        });

        // but not these
        $http.get('/api/forbidden').then(function (response) {
          console.log('got things with fobidden permission');
          console.log(response);
        }, function (response) {
          console.log('could not fetch /api/forbidden');
          console.log(response);
        });

      }, function (response) {
        console.log('something went wrong');
        console.log(response);
      });


    }

  });
