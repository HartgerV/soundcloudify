'use strict';
angular.module('myApp')
    .controller('RoomsCtrl', function($scope,$http) {
    $scope.refresh = function() {$http.get('http://localhost:8080/api/rooms').then(function(response) {
        $scope.rooms = response.data;
        console.log($scope.rooms);
    })};
    $scope.createRoom = function() {
        $http.post('http://localhost:8080/api/rooms', {name:$scope.newroomname}).
            then($scope.refresh);
    };

    $scope.refresh();
});