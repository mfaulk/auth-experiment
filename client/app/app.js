'use strict';

angular.module('authWithNodeApp', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'angular-storage',
  'ui.router'
])
  .config(function ($stateProvider, $urlRouterProvider, $httpProvider, $locationProvider) {
    $urlRouterProvider
      .otherwise('/');

    $locationProvider.html5Mode(true);

    $httpProvider.interceptors.push('apiInterceptor');
  })
  // $broadcast events
  .constant('EVENTS', {
    'UNAUTHORIZED': 'unauthorized',
    'AUTHORIZED': 'authorized'
  });
