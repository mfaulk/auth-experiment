'use strict';

angular.module('authWithNodeApp')
  .factory('apiInterceptor', function ($q, $rootScope, EVENTS, userService) {

    /**
     * Request interceptor
     * @param config - an http config object.
     * @returns {*} the config object directly, or a promise containing the config or a new config object.
     */
    function request(config) {
      var currentUser = userService.getCurrentUser();
      var accessToken = currentUser ? currentUser.accessToken : null;
      if (accessToken) {
        config.headers.authorization = accessToken;
      }
      return config;
    }

    /**
     * ResponseError interceptor handles errors or rejections from previous interceptors.
     * @param rejection
     * @returns {Promise}
     */
    function responseError(rejection) {
      if (rejection.status === 401) {
        $rootScope.$broadcast(EVENTS.UNAUTHORIZED);
        // This may be a fine place to redirect to the login page
      }
      //if(canRecover(rejection)) {
      //  return responseOrNewPromise
      //}
      return $q.reject(rejection);
    }

    return {
      request: request,

      // requestError interceptor gets called when a previous interceptor threw an error or resolved with a rejection.
      // requestError: requestError,

      // response interceptors get called with http response object. The function is free to modify the response object
      // or create a new one. The function needs to return the response object directly, or as a promise containing the
      // response or a new response object.
      // response: response,

      responseError: responseError
    };
  }
);
