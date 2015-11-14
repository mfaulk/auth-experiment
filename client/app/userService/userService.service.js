'use strict';

angular.module('authWithNodeApp')
  .factory('userService', ['store', function (store) {
    var currentUser = null;

    function setCurrentUser(user) {
      currentUser = user;
      store.set('user', user);
      return currentUser;
    }

    function getCurrentUser() {
      if (!currentUser) {
        currentUser = store.get('user');
      }
      return currentUser;
    }

    // Public API here
    return {
      getCurrentUser: getCurrentUser,
      setCurrentUser: setCurrentUser
    };
  }]);
