'use strict';

angular.module('authWithNodeApp')
  .factory('authService', function ($http, $q, $state) {

    return {
      isAuthenticated: function(){
        var deferred = $q.defer();
        $http.get('/api/loggedin').success(function(user) {
          // Authenticated
          if(user !== '0') {
            console.log('authService:isAthenticated: ','yes');
            console.log(user);
            deferred.resolve(true);
          } else {
            deferred.reject();
            console.log('authService:isAthenticated: ','no. Going to login.');
            $state.go('login');
          }
        });
        return deferred.promise;
      }
    };
  });
