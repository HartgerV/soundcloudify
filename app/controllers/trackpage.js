'use strict';
angular.module('myApp')
.controller('TrackPageCtrl', function($scope, $routeParams) {
    console.log("TrackPageCtrl triggered");
    $scope.routeParams = $routeParams;
    SC.get('/tracks/'+$scope.routeParams.id,{},function(trackpage){
        $scope.trackpage = trackpage;
        console.log(trackpage);
        $scope.$apply();
    });
    $scope.menuOptions = [
        ['Buy', function ($itemScope) {
            $scope.player.gold -= $itemScope.item.cost;
        }],
        null,
        ['Sell', function ($itemScope) {
            $scope.player.gold += $itemScope.item.cost;
        }]
    ];
});
