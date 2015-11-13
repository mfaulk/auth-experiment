'use strict';

angular.module('authWithNodeApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('main', {
        url: '/',
        templateUrl: 'app/main/main.html',
        controller: 'MainCtrl',
        controllerAs: 'vm',
        resolve: {
          authenticated: function(authService) {
            return authService.isAuthenticated();
          }
        }
      });
  });