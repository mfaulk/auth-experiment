'use strict';

angular.module('authWithNodeApp')
  .controller('LoginCtrl', function ($rootScope, $scope, $state, $http, EVENTS, userService) {
    var vm = this;
    activate();

    function activate() {
      vm.username = '';
      vm.password = '';
      vm.submit = submitLogin;
    }

    function submitLogin() {
      if (vm.username && vm.password) {
        $http.post('/api/login/', {username: vm.username, password: vm.password}).then(function (response) {
          console.log('login.controller: login succeeded.');
          console.log(response);
          var currentUser = {};
          currentUser.accessToken = response.data.id;
          console.log(currentUser);
          userService.setCurrentUser(currentUser);
          $rootScope.$broadcast(EVENTS.AUTHORIZED);
          vm.username = '';
          vm.password = '';
          console.log('going to main');
          $state.go('main');
        }, function (response) {
          console.log('something went wrong');
          console.log(response);
        });
      }
    }
  });
