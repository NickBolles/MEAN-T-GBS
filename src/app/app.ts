/// <reference path="../../typings/index.d.ts" />

// todo: import any other modules you need
//   It is best to have them self contained so that you can basically just require them
//   and have your base module depend on them to work. Modularization rocks!
import 'angular';
import 'angular-aria';
import 'angular-animate';
import 'angular-ui-router';
import 'angular-material';
import {IndexModule, IndexService, IndexController} from './modules/index/index';
// todo: Rename the module to your app name
module helloWorld {
    "use strict";
    angular.module("app", [
        "ui.router", "ngMaterial", IndexModule.name])
        .config(routes)
        .service('IndexService', IndexService);

    // todo: add your routes
    routes.$inject = ["$stateProvider", "$urlRouterProvider"];
    function routes($stateProvider: ng.ui.IStateProvider, $urlRouterProvider: ng.ui.IUrlRouterProvider) {

        $urlRouterProvider.otherwise('/');

        $stateProvider
            .state('/', {
                url: '/',
                templateUrl: 'nb.home',
                controller: IndexController
            })

    }

}
