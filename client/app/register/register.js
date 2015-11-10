'use strict';

angular.module('authWithNodeApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('register', {
        url: '/register',
        templateUrl: 'app/register/register.html',
        controller: 'RegisterCtrl',
        controllerAs: 'vm'
      });
  });