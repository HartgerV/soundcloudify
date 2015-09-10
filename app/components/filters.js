'use strict';

angular.module('myApp')
    .filter("sanitize", ['$sce', function($sce) {
        return function(htmlCode){
            return $sce.trustAsHtml(htmlCode);
        }
    }]);
