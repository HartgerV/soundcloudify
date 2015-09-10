'use strict';
angular.module('myApp')
    .controller('SrchCtrl', function($scope, $routeParams) {
        $scope.routeParams = $routeParams;
        SC.get('/tracks', {q: $scope.routeParams.query, sharing: 'public'}, function (tracks) {
            $scope.$apply(function () {
                $scope.tracks = tracks;
            });
            console.log("Query " + $routeParams.query + " completed");
        });
    });