'use strict';

angular.module('authWithNodeApp')
  .controller('LoginCtrl', function ($scope) {
    var vm = this;
    activate();

    function activate() {
      vm.username = '';
      vm.password = '';
      vm.submit = submitLogin;
    }

    function submitLogin() {
      console.log("submitting...");
      if(vm.username && vm.password) {
        console.log('successful!');
        console.log(vm);
      }
    }
  });
