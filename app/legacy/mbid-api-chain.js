/**
 * Created by hartger on 09/09/15.
 */
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