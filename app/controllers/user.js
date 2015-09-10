'use strict';
angular.module('myApp')
.controller('UserCtrl', function($scope, $routeParams) {
    console.log("UserCtrl triggered");
    $scope.routeParams = $routeParams;
    SC.get('/users/'+$scope.routeParams.id,{},function(user){
        $scope.user = user;
        console.log(user);
        SC.get('/users/'+$scope.user.id+'/tracks',{sharing: 'public'},function(tracks) {
            $scope.usertracks = tracks;
            $scope.$apply();
        });
        $scope.avatarclass="image-anim";
    });
    $scope.random = function() {
        return 0.5 - Math.random();
    }
});
