'use strict';

angular.module('authWithNodeApp')
  .controller('MainCtrl', function ($scope, $http) {
    var vm = this;
    activate();

    function activate() {
      $http.post('/api/login/', {username:'admin', password:'admin'}).then(function (response) {
        console.log(response.data);
      }, function (response) {
        console.log('something went wrong');
        console.log(response);
      });

      //$http.get('/api/things').then(function (response) {
      //  console.log(response.data);
      //}, function (response) {
      //  console.log('something went wrong');
      //  console.log(response);
      //});
    }

  });
