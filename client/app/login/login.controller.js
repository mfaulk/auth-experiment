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
          console.log(response);
          var currentUser = {};
          currentUser.accessToken = response.id;
          console.log(currentUser);
          userService.setCurrentUser(currentUser);
          $rootScope.$broadcast(EVENTS.AUTHORIZED);
          vm.username = '';
          vm.password = '';
          $state.go('main');
        }, function (response) {
          console.log('something went wrong');
          console.log(response);
        });
      }
    }
  });
