'use strict';

// Declare app level module which depends on views, and components
var myApp = angular.module('myApp', [
  'ngRoute',
  'myApp.version',
  'mgcrea.ngStrap',
  'ui.sortable',
  'angular.filter',
  'ngDragDrop',
  'btford.socket-io'
]);

myApp.config(['$locationProvider','$routeProvider', function($locationProvider,$routeProvider) {
      $routeProvider.when('/user/:id',{
        templateUrl: 'views/user.html',
        controller: "UserCtrl"
      }).
      when('/track/:id',{
        templateUrl: 'views/track.html',
        controller: "TrackPageCtrl"
      }).
      when('/featured',{
          templateUrl: 'views/featured.html'
      }).
      when('/search/:query',{
        templateUrl: 'views/search.html',
        controller: "SrchCtrl"
      }).
      when('/rooms',{
              templateUrl: 'views/rooms.html',
              controller: 'RoomsCtrl'
      }).
          when('/room/:id', {
             templateUrl: 'views/room.html',
             controller: 'RoomCtrl'
          }).
      when('/yolo',   {
        template: 'yolo'
      }).
      when('/', {
        templateUrl: 'views/featured.html'
      }).
      when('/queue',  {
        templateUrl: 'views/queue.html'
      }).
      when('/playing', {
          templateUrl: 'views/playing.html'
      }).
      when('/autodj', {
          templateUrl: 'views/autodj.html'
      }).
      when('/history', {
          templateUrl: 'views/history.html'
      }).
      when('/visualize', {
          templateUrl: 'views/visualizer.html'
      }).
      when('/control', {
            templateUrl: 'views/control.html'
      }).
      otherwise({redirectTo: '/featured'});
}]);

myApp.directive('fadeIn', function($timeout){
  return {
    restrict: 'A',
    link: function($scope, $element, attrs){
      $element.addClass("ng-hide-remove");
      $element.on('load', function() {
        $element.addClass("ng-hide-add");
      });
    }
  }
});

myApp.controller('SearchCtrl', function($http,$scope,$rootScope,Room,Queue,socket) {
  $rootScope.$on('playlist:update', function(){
     console.log("playlist updated");
     var playlist = Room.getPlaylist();
     Queue.splice(0,Queue.length);
     for(var i=0; i<playlist.length; i++){
         addToQueue(playlist[i]);
     }
  });
    $scope.$on('pingback', function(){
      console.log("pingback");
  });
  $scope.ping = function() {
      socket.emit('ping');
  };
    $scope.tracklist = {
    placeholder: "placeholder",
    connectWith: ".sortable",
    items: "li",
    helper: function () {
      return $('<span class="glyphicon glyphicon-music"></span>')
    }
  };
  $scope.sound="";
  $scope.playstatus="";
  $scope.queue=Queue;
  $scope.history= [{}];
  Queue.shift();
  $scope.progress="";
  $scope.volume=80;
  $scope.showsearch=0;
  $scope.browser=window.innerHeight;
  $(document).click(function(event) {
    if(!$(event.target).closest('#searchPopover').length) {
      $scope.$apply(function(){
        $scope.showsearch=0;
      });
    }
  });
  $scope.sliderConfig = {
    min: 0,
    max: 100,
    step: 1
  };
  $scope.setVolume = function(volume) {
    $scope.volume = volume;
  };

  $scope.$watch("queue", function(newValue,oldValue) {
    console.log(newValue);
    console.log("Queue changed!");
  });


  $scope.$watch("query", function(newValue, oldValue) {
    if(newValue.length > 0) {
      SC.get('/tracks', {q: newValue, sharing: 'public'}, function (tracks) {
        if (newValue === $scope.query) {
          $scope.$apply(function () {
            $scope.tracks = tracks;
            $scope.showsearch=1;
            //Queue = tracks;
          });
          console.log("Query " + newValue + " completed");
          console.log($scope.tracks);
        } else {
          //console.log($scope.phones);
          console.log("Query " + newValue + " ignored");
        }
      })
    }
  });

  $scope.searchTrack = function searchTrack(query) {
      var promise = SC.get('/tracks/', {q: query, sharing: 'public'}, function (tracks) {
        return tracks;
      });
      console.log(query);
      return promise;
  };
  $scope.play= function(id) {
    if($scope.sound) {$scope.sound.stop();} //if(isset(sound)?stop
    SC.stream(id, {
        usePeakData: true,
        //Add eventlistener for 500ms before end off track, for playing next track without calling onfinish event (which bugs out on android)
        onload: function () {
            if(/(android)/i.test(navigator.userAgent)){
                console.log("android nextplay");
                this.onPosition(this.duration-500,function(){
                    console.log('track finished onjustbeforefinish event');
                    angular.element('#androidPlayNext').trigger('click');
                });
            }
            else {
                this.onPosition(this.duration - 500, function () {
                    console.log('track finished onjustbeforefinish event');
                    $scope.playNext();
                });
            }
        },
        //onfinish:function(){ $scope.sound.setPosition(0);console.log('track finished onfinish event');$scope.playNext();}
    },
                   function(song,error){
      if(error) {
        console.log(error);
        $scope.playNext();
      }
      else {
        console.log("playing track:");
        console.log(song);
        $scope.sound = song;
        $scope.sound.play({
          whileplaying: function () {
            $scope.$apply(function () {
              $scope.browser = window.innerHeight;
              $scope.progress = {'width': (($scope.sound.position / $scope.sound.duration) * 100) + '%'};
            });
            //console.log($scope.sound);
          }
        });
        if ($scope.playstatus != "playing") {
          $scope.sound.pause();
        }
        else {
            console.log("reset");
            $scope.sound.setPosition(0);
        }
        $scope.$watch("volume", function (newValue, oldValue) {
          $scope.sound.setVolume(newValue);
          console.log(newValue);
        });
        $("#seekBase").click(function (e) {
          var x = e.pageX - $(this).offset().left;
          var width = $(this).width();
          var duration = $scope.sound.durationEstimate;
          $scope.sound.setPosition((x / width) * duration);
        });
      }
    });
    SC.get('/tracks/'+id, function(track) {
      $scope.playing = track;
      $scope.$apply();
    });

  };

  $scope.toggleShuffle = function toggleShuffle(){
    if($scope.shuffle==1){
      $scope.shuffle=0;
    }
    else {
      $scope.shuffle=1;
    }
    $('#shufflebutton').toggleClass('glyphicon-random').toggleClass('glyphicon-retweet');
  };

  $scope.playPrevious = function playPrevious() {
    var toplay;
    toplay = $scope.history.pop();
    $scope.play(toplay.id);
  };

  $scope.playNext= function playNext() {
    if($scope.playing) {
      $scope.history.push($scope.playing);
    }
    var toplay;
    if($scope.shuffle==1){
      var rand = Math.floor(Math.random()*Queue.length);
      toplay = Queue[rand];
      Queue.splice(rand,1);
      $scope.play(toplay.id);
    }
    else {
      toplay = Queue.shift();
      $scope.play(toplay.id);
    }
  };
  //$scope.playNext= playNext;
  $scope.addToRoom = function(track) {
      $http.put('http://localhost:8080/api/rooms/' + Room.getRoom(), {track: track});
  }
  function addToQueue(track) {
    //var currentList = Queue;
    //var newList = currentList.concat(track);
    //Queue = newList;
    if($scope.playing == null) {
      $scope.play(track.id);
    }
    else {
      Queue.push(track);
      console.log(track);
      console.log(Queue);

      if (Queue.length > 0 && !($('#sidebarqueue').hasClass('sidebarshift'))) {
        $('#sidebarqueue').addClass('sidebarshift');
      }
    }
  }
  $scope.addToQueue = addToQueue;

  $scope.removeQueueTrack = function removeQueueTrack(index) {
    Queue.splice(index,1);
  };

  function togglePlaystatus(event) {
    if($scope.playstatus == "playing"){
      $scope.playstatus = "paused";
    }else {
      $scope.playstatus = "playing";
    }
    console.log($scope.playstatus);
  };
  $scope.togglePlaystatus=togglePlaystatus;

  $scope.pauseUnpause =function pauseUnpause() {
    if($scope.sound) {
      $scope.sound.togglePause();
      $scope.togglePlaystatus();
      $('.control').find('.pauseunpause').toggleClass("glyphicon-pause");
      $('.control').find('.pauseunpause').toggleClass("glyphicon-play");
    }
    else {
      console.log("no track selected!");
    }
  };
  $('#control').find('#pauseunpause').click(function() {
    if($scope.sound) {
      $scope.sound.togglePause();
      $scope.togglePlaystatus();
      $(this).toggleClass("glyphicon-pause");
      $(this).toggleClass("glyphicon-play");
    }
    else {
      console.log("no track selected!");
    }
  });
  $('#searchfield').keydown(function (event) {
    var keypressed = event.keyCode || event.which;
    if (keypressed == 13) {
      var query= "#/search/"+$(this).val();
      window.location.href = query;
    }
  });
  $scope.msToTime = function msToTime(s) {
    var input = s;
    var ms = s % 1000;
    s = (s - ms) / 1000;
    var secs = s % 60;
    s = (s - secs) / 60;
    var mins = s % 60;
    var hrs = (s - mins) / 60;
    var returnstring="";
    if(input>=3600000) {
      returnstring=hrs+':';
    }
    returnstring+=mins + ':';
    if(secs<10){returnstring+="0";};
    returnstring+= secs;

    return returnstring;
  };




  $scope.addRelatedTrack = function addRelatedTrack(track,number,recursion) {
    $http.get('https://api.soundcloud.com/tracks/'+track.id+'/related?client_id=b4fe049a798114e6ab42ba20a2738ac9')
        .success(function(data, status, headers, config){
          var tempnumber=number;
          for(var i=0;i<data.length&&i<tempnumber;i++) {
            var unsuitable = 0;
            for(var q=0;q<Queue.length;q++) {
              if (data[i].id == Queue[q].id) {
                unsuitable = 1;
                tempnumber++;
                console.log(data[i].id + " identical to " + Queue[q].id);
              }
            }
            if( unsuitable!=1 &&
            (   data[i].streamable == "false" ||
                data[i].duration < 150000 ||
                data[i].duration > 1000000  )
            ) {
              unsuitable = 1;
              tempnumber++;
              console.log(data[i].id + " unstreamable");
            }
            if(unsuitable != 1 && data[i].user.id == track.user.id) {
              unsuitable = 1;
              tempnumber++;
            }
            if(unsuitable != 1){
              addToQueue(data[i]);
            }
          }
          if(recursion>0){
            addRelatedTrack(data[number-1],number,recursion-1);
          }
        })
        .error(function(data, status, headers, config){
          console.log("Error adding related track!");
        });
  };

  $scope.addAutoDjTrack = function addAutoDjTrack(bpmrange,tagamount,depth){
    var lasttrack = Queue[Queue.length-1];
    console.log("lasttrack"+lasttrack);
    console.log(lasttrack);
    var filter={};
    var tags=lasttrack.tag_list.split(" ");
    if(lasttrack.bpm > 0) {
      filter["bpm[from]"]=(lasttrack.bpm-bpmrange);
      filter["bpm[to]"]=(lasttrack.bpm+bpmrange);
    };
    if(tags.length>0) {
      for(var i=0;i<tagamount&&i<tags.length;i++) {
        filter.tags+=tags[Math.floor(Math.random()*tags.length)];
        console.log(tags[Math.floor(Math.random()*tags.length)]);
      }
    };
    filter.sharing = 'public';
    filter["duration[from]"]=66000;
    filter["duration[to]"]=1020000;
    if(depth==0) {
      filter.genres=lasttrack.genre;
    }
    filter["playback_count[from]"]=100;
    //console.log(filter);return;
    SC.get('/tracks', filter , function (tracks) {
      var unsuitable;
      while(tracks.length>0) {
        var track=tracks.shift();
        for(var i=0;i<Queue.length;i++){
          if(track.id==Queue[i].id) {
            unsuitable = 1;
            console.log(track.id+" identical to "+Queue[i].id);
          }
          if(track.playback_count < 100) {
            unsuitable = 1;
            console.log("Too few plays.")
          }

        }
        if(unsuitable!=1){
          addToQueue(track);
          return;
        }
      }
        console.log("no track found");
        if(depth < 10) {
          addAutoDjTrack(bpmrange + 2, tagamount - 1, depth + 1);
        }

    });
  };
  function leftright() {
    if(Math.random()> 0.5) {
      return "left";
    }
    return "right";
  }
  function bottomtop() {
    if(Math.random()> 0.5) {
      return "bottom";
    }
    return "top";
  }
  $scope.fillVisualizer = function fillVisualizer(amount) {
    var colorarray= ['#101010','#aaa', '#313131', 'orange'];
    //var visualizer= $('#visualizer');

    for(var i = 0; i<amount; i++) {
      var randarray= [Math.random(),Math.random(),Math.random(),Math.random(),Math.random()];
      var style= 'position:absolute;'+bottomtop()+':{{sound.peakData.'+leftright()+'*'+Math.random()*50+'+'+Math.random()*100+'+"%"}};'+leftright()+':{{sound.peakData.'+leftright()+'*'+Math.random()*50+'+'+Math.random()*100+'+"%"}};height:{{sound.peakData.'+leftright()+'*'+500*Math.random()+40+'+"px"}};width:{{sound.peakData.'+leftright()+'*'+500*Math.random()+40+'+"px"}};opacity:{{sound.peakData.'+leftright()+'*'+200*Math.random()+'}};background-color: '+colorarray[Math.floor(Math.random()*4)]+';';
      console.log(style);
      jQuery('<div/>', {
        style: style,
        class: 'visualizerbox'
      }).appendTo('#visualizer');
    }
  };
})
    .factory('Queue', function () {
        var queue = [{}];
        return queue;
        //return {
        //    getQueue: function () {
        //        return queue;
        //    },
        //    setQueue: function(newQueue) {
        //        queue=newQueue;
        //    },
        //    pushQueue: function(track) {
        //        queue.push(track);
        //    },
        //    shiftQueue: function() {
        //        return queue.shift();
        //    },
        //    setCurrentCode: function (currentCode,id) {
        //        questions[id].currentcode = currentCode;
        //    }
        //};
    })
    .factory('Room', ['$http','$rootScope',function($http, $rootScope) {
        var room_id;
        var playlist = [{}];
        function setRoom(id) {
            room_id=id;
            updatePlaylist();
            console.log(room_id);
        }
        function getRoom() {
            return room_id;
        }
        function getPlaylist() {
            return playlist;
        }
        function updatePlaylist() {
            $http.get('http://localhost:8080/api/rooms/'+room_id)
                .then(function(response){console.log(response);
                    playlist = response.data.playlist;
                $rootScope.$emit('playlist:update');
                console.log(playlist);
                });
        }

        return {
            setRoom : setRoom,
            getRoom : getRoom,
            getPlaylist : getPlaylist,
            updatePlaylist : updatePlaylist
        }
    }])
    .factory('socket', function (socketFactory) {
        var io_socket = io();
        var socket = socketFactory(io_socket);
        socket.forward('message');
        return socket;
    });





//myApp.directive('ngContextMenu', function ($parse) {
//  var renderContextMenu = function ($scope, event, options) {
//    if (!$) { var $ = angular.element; }
//    $(event.target).addClass('context');
//    var $contextMenu = $('<div>');
//    $contextMenu.addClass('dropdown clearfix');
//    var $ul = $('<ul>');
//    $ul.addClass('dropdown-menu');
//    $ul.attr({ 'role': 'menu' });
//    $ul.css({
//      display: 'block',
//      position: 'absolute',
//      left: event.pageX + 'px',
//      top: event.pageY + 'px'
//    });
//    angular.forEach(options, function (item, i) {
//      var $li = $('<li>');
//      if (item === null) {
//        $li.addClass('divider');
//      } else {
//        $a = $('<a>');
//        $a.attr({ tabindex: '-1', href: '#' });
//        $a.text(item[0]);
//        $li.append($a);
//        $li.on('click', function () {
//          $scope.$apply(function() {
//            item[1].call($scope, $scope);
//          });
//        });
//      }
//      $ul.append($li);
//    });
//    $contextMenu.append($ul);
//    $contextMenu.css({
//      width: '100%',
//      height: '100%',
//      position: 'absolute',
//      top: 0,
//      left: 0,
//      zIndex: 9999
//    });
//    $(document).find('body').append($contextMenu);
//    $contextMenu.on("click", function (e) {
//      $(event.target).removeClass('context');
//      $contextMenu.remove();
//    }).on('contextmenu', function (event) {
//      $(event.target).removeClass('context');
//      event.preventDefault();
//      $contextMenu.remove();
//    });
//  };
//  return function ($scope, element, attrs) {
//    element.on('contextmenu', function (event) {
//      $scope.$apply(function () {
//        event.preventDefault();
//        var options = $scope.$eval(attrs.ngContextMenu);
//        if (options instanceof Array) {
//          renderContextMenu($scope, event, options);
//        } else {
//          throw '"' + attrs.ngContextMenu + '" not an array';
//        }
//      });
//    });
//  };
//});