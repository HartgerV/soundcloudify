var myapp = angular.module('sortableApp', ['ui.sortable']);


myapp.controller('sortableController', function ($scope) {
    var tmpList = [];

    $scope.rawScreens = [
        [{
            icon: './img/icons/facebook.jpg',
            title: 'Facebook (a)',
            link: 'http://www.facebook.com'
        }, {
            icon: './img/icons/youtube.jpg',
            title: 'Youtube (a)',
            link: 'http://www.youtube.com'
        }, {
            icon: './img/icons/gmail.jpg',
            title: 'Gmail (a)',
            link: 'http://www.gmail.com'
        }, {
            icon: './img/icons/google+.jpg',
            title: 'Google+ (a)',
            link: 'http://plus.google.com'
        }, {
            icon: './img/icons/twitter.jpg',
            title: 'Twitter (a)',
            link: 'http://www.twitter.com'
        }, {
            icon: './img/icons/yahoomail.jpg',
            title: 'Yahoo Mail (a)',
            link: 'http://mail.yahoo.com'
        }, {
            icon: './img/icons/pinterest.jpg',
            title: 'Pinterest (a)',
            link: 'http://www.pinterest.com'
        }],
        [{
            icon: './img/icons/facebook.jpg',
            title: 'Facebook (b)',
            link: 'http://www.facebook.com'
        }, {
            icon: './img/icons/youtube.jpg',
            title: 'Youtube (b)',
            link: 'http://www.youtube.com'
        }, {
            icon: './img/icons/gmail.jpg',
            title: 'Gmail (b)',
            link: 'http://www.gmail.com'
        }, {
            icon: './img/icons/google+.jpg',
            title: 'Google+ (b)',
            link: 'http://plus.google.com'
        }, {
            icon: './img/icons/twitter.jpg',
            title: 'Twitter (b)',
            link: 'http://www.twitter.com'
        }, {
            icon: './img/icons/yahoomail.jpg',
            title: 'Yahoo Mail (b)',
            link: 'http://mail.yahoo.com'
        }, {
            icon: './img/icons/pinterest.jpg',
            title: 'Pinterest (b)',
            link: 'http://www.pinterest.com'
        }]
    ];

    $scope.list1 = $scope.rawScreens[0];
    $scope.list2 = [{
        icon: './img/icons/pinterest.jpg',
        title: 'Pinterest (b)',
        link: 'http://www.pinterest.com'
    }];


    $scope.sortingLog = [];

    $scope.sortableOptions = {
        placeholder: "app",
        connectWith: ".apps-container"
    };

    $scope.logModels = function () {
        $scope.sortingLog = [];
        for (var i = 0; i < $scope.rawScreens.length; i++) {
            var logEntry = $scope.rawScreens[i].map(function (x) {
                return x.title;
            }).join(', ');
            logEntry = 'container ' + (i+1) + ': ' + logEntry;
            $scope.sortingLog.push(logEntry);
        }
    };
});