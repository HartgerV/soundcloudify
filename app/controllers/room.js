'use strict';
angular.module('myApp')
.controller('RoomCtrl', function($scope,$rootScope,$http,$routeParams,socket,Room,Queue) {

        $rootScope.$on('playlist:update',function(){
           $scope.refresh();
        });
        $scope.id=$routeParams.id;
    $scope.join = function() {
        Room.setRoom($scope.id);
    };
    $scope.refresh = function() {$http.get('http://localhost:8080/api/rooms/'+$scope.id).then(function(response) {
        $scope.room = response.data;
    })};


    $scope.addPlaylist = function() {
        $http.put('http://localhost:8080/api/rooms/'+$scope.id, {playlist:$scope.$parent.queue})
            .then(function(){
            $scope.refresh();
        });
    };
    socket.on('room:update', function(){
        $scope.refresh();
        Room.updatePlaylist();
    });
    $scope.refresh();
});