import 'angular';
'use strict';
// export interface IIndexService extends ng.IServiceProvider {
//    
// }
export class IndexService {

    //static $inject = [];
    constructor() {
    }

    returnHelloWorld():string {
        return "Hello World From Service";
    }
}

angular.module('nb.index').service('IndexService', IndexService);


