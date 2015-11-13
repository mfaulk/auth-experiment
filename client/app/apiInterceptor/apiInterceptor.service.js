'use strict';

angular.module('authWithNodeApp')
  .factory('apiInterceptor', function ($q, $rootScope, EVENTS, userService) {

    // not sure how this all compares to setting default headers via $http, e.g. http://stackoverflow.com/questions/14183025/setting-application-wide-http-headers-in-angularjs
    function request(config) {
      //console.log('apiInterceptor:request');
      //console.log(config);
      var currentUser = userService.getCurrentUser();
      var accessToken = currentUser ? currentUser.accessToken : null;
      if (accessToken) {
        config.headers.authorization = accessToken;
      }
      return config;
    }

    function responseError(rejection) {
      //console.log('apiInterceptor:responseError');
      if (rejection.status === 401) {
        $rootScope.$broadcast(EVENTS.UNAUTHORIZED);
        // This may be a fine place to redirect to the login page
      }

      //if(canRecover(rejection)) {
      //  return responseOrNewPromise
      //}

      // Rejecting makes this work
      return $q.reject(rejection);
    }

    // Public API here
    return {
      request: request,
      responseError: responseError
    };
  }
);
