'use strict';

angular.module('authWithNodeApp')
  .controller('RegisterCtrl', function ($scope) {
    var vm = this;
    activate();

    function activate() {
      vm.username = '';
      vm.password = '';
      vm.submit = submitRegistration;
    }

    function submitRegistration() {
      console.log("submitting...");
      if(vm.username && vm.password) {
        console.log('successful!');
        console.log(vm);
      }
    }

  });
