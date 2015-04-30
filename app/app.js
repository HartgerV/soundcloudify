'use strict';

// Declare app level module which depends on views, and components
var myApp = angular.module('myApp', [
  'ngRoute',
  'myApp.version',
  'mgcrea.ngStrap',
  'ui.sortable',
  'angular.filter',
  'ngDragDrop'
]);

myApp.config(['$locationProvider','$routeProvider', function($locationProvider,$routeProvider) {
      $routeProvider.when('/user/:id',{
        templateUrl: 'views/user.html',
        controller: "UserCtrl"
      }).
      when('/featured',{
          templateUrl: 'views/featured.html'
      }).
      when('/search/:query',{
        templateUrl: 'views/search.html',
        controller: "SrchCtrl"
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

myApp.directive("slider", function() {
  return {
    restrict: 'A',
    scope: {
      config: "=config",
      price: "=model"
    },
    link: function(scope, elem, attrs) {
      var setModel = function(value) {
        scope.model = value;
      }

      $(elem).slider({
        range: false,
        min: scope.config.min,
        max: scope.config.max,
        step: scope.config.step,
        slide: function(event, ui) {
          scope.$apply(function() {
            scope.price = ui.value;
          });
        }
      });
    }
  }
});

myApp.controller('SrchCtrl', function($scope, $routeParams) {
  $scope.routeParams = $routeParams;
  SC.get('/tracks', {q: $scope.routeParams.query, sharing: 'public'}, function (tracks) {
    $scope.$apply(function () {
      $scope.tracks = tracks;
    });
    console.log("Query " + $routeParams.query + " completed");
  });
});

myApp.controller('SearchCtrl', function($http,$scope) {
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
  $scope.queue= [{}];
  $scope.history= [{}];
  $scope.queue.shift();
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
            //$scope.queue = tracks;
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
    SC.stream(id, {usePeakData: true,onfinish: function(){ console.log('track finished');$scope.playNext();}}, function(song){
      var tick = 0;
      console.log("playing "&song);
      $scope.sound = song;
      $scope.sound.play({
        whileplaying: function(){
          $scope.$apply(function(){
            $scope.browser=window.innerHeight;
            $scope.progress = { 'width' : (($scope.sound.position / $scope.sound.duration) * 100)+'%'};
          });
          //console.log($scope.sound);
        }
      });
      if($scope.playstatus!="playing"){
          $scope.sound.pause();
      }
      $scope.$watch("volume", function(newValue,oldValue) {
        $scope.sound.setVolume(newValue);
        console.log(newValue);
      });
      $("#seekBase").click(function (e) {
        var x = e.pageX - $(this).offset().left;
        var width = $(this).width();
        var duration = $scope.sound.durationEstimate;
        $scope.sound.setPosition((x / width) * duration);
      });
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
      var rand = Math.floor(Math.random()*$scope.queue.length);
      toplay = $scope.queue[rand];
      $scope.queue.splice(rand,1);
      $scope.play(toplay.id);
    }
    else {
      toplay = $scope.queue.shift();
      $scope.play(toplay.id);
    }
  };
  //$scope.playNext= playNext;

  function addToQueue(track) {
    //var currentList = $scope.queue;
    //var newList = currentList.concat(track);
    //$scope.queue = newList;
    if($scope.playing == null) {
      $scope.play(track.id);
    }
    else {
      $scope.queue.push(track);
      console.log(track);
      console.log($scope.queue);

      if ($scope.queue.length > 0 && !($('#sidebarqueue').hasClass('sidebarshift'))) {
        $('#sidebarqueue').addClass('sidebarshift');
      }
    }
  }
  $scope.addToQueue = addToQueue;

  $scope.removeQueueTrack = function removeQueueTrack(index) {
    $scope.queue.splice(index,1);
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
      $('#control').find('#pauseunpause').toggleClass("glyphicon-pause");
      $('#control').find('#pauseunpause').toggleClass("glyphicon-play");
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


  $scope.scToSimilar = function scToSimilar(user) {
    $scope.getMBID(user.id,user.username,user.permalink_url);
  };
  //Gets MBID of similar artists using last.fm api
  //@mbid - MBID of artist
  //@return - array of mbid
  $scope.getSimilarArtists = function getSimilarArtists(mbid) {
    $http.get('http://ws.audioscrobbler.com/2.0/?method=artist.getsimilar&mbid='+mbid+'&api_key=61984ea34c8e9138ca95d73f036b4e20&format=json')
        .success(function(data, status, headers, config){
          var mbidarray=[];
          for(var i=0;i<data.similarartists.artist.length && i<6;i++) {
            mbidarray.push(data.similarartists.artist[i].mbid);
            $scope.getSCIDbyMBID(data.similarartists.artist[i].mbid);
          }
          console.log(mbidarray);
          //TODO
          console.log($scope.getSCIDbyMBID(mbidarray[0]));
          return mbidarray;
        })
        .error(function(data){

        });
  };

  //Gets SC user by MBID
  //@mbid - MBID of artist
  //@return - SC user
  $scope.getSCIDbyMBID = function getSCIDbyMBID(mbid) {
    $http.get('http://musicbrainz.org/ws/2/artist/'+mbid+'?inc=url-rels&fmt=json')
        .success(function(data) {
          for (var i = 0; i < data.relations.length; i++) {
            if (data.relations[i]["type-id"] == "89e4a949-0976-440d-bda1-5f772c1e5710") {
              var sclink = data.relations[i].url.resource;
              SC.get('/resolve', { url:sclink },function(user) {
                console.log(user.username);
                //TODO
                SC.get('/users/'+user.id+'/tracks',{sharing: 'public'},function(tracks) {
                  var track = tracks[(Math.floor(Math.random()*tracks.length))];
                  var unsuitable;
                  for(var i=0;i<$scope.queue.length;i++) {
                    if (track.id == $scope.queue[i].id) {
                      unsuitable = 1;
                      console.log(track.id + " identical to " + $scope.queue[i].id);
                    }
                  }
                  if(track.duration < 66000 || track.duration > 1000000) {
                    unsuitable = 1
                  }
                  if(unsuitable!=1){
                    addToQueue(track);
                  }

                });
                return user;
              });
            }
          }
        })
        .error(function(data){

        });
  };

  //Gets MBID of sc user acount
  //May fail when SC username differs too much from artist name
  //Will fail if there is no SC relation registered on MB
  //@scid - soundcloud user id
  //@username - soundcloud username
  //@permalink_url - soundcloud permalink url
  //@return : mbid or "failed"
  $scope.getMBID = function getMBID(scid,username,permalink_url) {
    $http.get('http://search.musicbrainz.org/ws/2/artist/?query='+username+'&fmt=json')
        .success(function(data, status, headers, config){
          console.log(data);
          for(var i=0; i < data["artist-list"].artist.length && i < 5; i++) {
            var id = data["artist-list"].artist[i].id;
            $scope.checkMBID(id,permalink_url);
          }
          return "failed";
        })
        .error(function(data, status, headers, config){
          console.log("Error retrieving MBID");
          console.log(data);
          return "failed";
        });
  };

  //Checks MBID belongs to SC user by retrieving relations and comparing sc url
  //@id - MBID
  //@permalink_url - Soundcloud permalink_url
  //@return : true if sc url matches mb sc url
  $scope.checkMBID = function(id,permalink_url){
    $http.get('http://musicbrainz.org/ws/2/artist/'+id+'?inc=url-rels&fmt=json')
        .success(function(data) {
          for(var i=0;i < data.relations.length;i++) {
            if(data.relations[i]["type-id"]=="89e4a949-0976-440d-bda1-5f772c1e5710") {
              var sclink = permalink_url.replace("https://","");
              sclink = sclink.replace("http://","");
              var mblink = data.relations[i].url.resource.replace("https://","");
              mblink = mblink.replace("http://","");
              console.log(data.relations[i].url.resource);
              if(mblink == sclink) {
                console.log(id);
                //TODO
                $scope.getSimilarArtists(id);
                return "true";
              }
            }
          }
        });
  };

  $scope.addRelatedTrack = function addRelatedTrack(track,number,recursion) {
    $http.get('https://api.soundcloud.com/tracks/'+track.id+'/related?client_id=b4fe049a798114e6ab42ba20a2738ac9')
        .success(function(data, status, headers, config){
          var tempnumber=number;
          for(var i=0;i<data.length&&i<tempnumber;i++) {
            var unsuitable = 0;
            for(var q=0;q<$scope.queue.length;q++) {
              if (data[i].id == $scope.queue[q].id) {
                unsuitable = 1;
                tempnumber++;
                console.log(data[i].id + " identical to " + $scope.queue[q].id);
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
    var lasttrack = $scope.queue[$scope.queue.length-1];
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
        for(var i=0;i<$scope.queue.length;i++){
          if(track.id==$scope.queue[i].id) {
            unsuitable = 1;
            console.log(track.id+" identical to "+$scope.queue[i].id);
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
});

myApp.controller('UserCtrl', function($scope, $routeParams) {
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

myApp.controller('AutoDJCtrl', function($scope) {
  console.log("AutoDJCtrl triggered");
  $scope.number = 3;
});