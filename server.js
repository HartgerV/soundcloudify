// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');
var Room     = require('./models/room');
var uuid    = require('node-uuid');

var mongoose   = require('mongoose');
mongoose.connect('mongodb://localhost:27017/every'); // connect to our database

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;        // set our port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

//MiddleWare
router.use(function(req, res, next) {
    // do logging
    console.log('Something is happening:');
    console.log(req.rawHeaders);
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    next(); // make sure we go to the next routes and don't stop here
});

router.route('/rooms')

    // create a room (accessed at POST http://localhost:8080/api/rooms)
    .post(function(req, res) {
        
        var room = new Room();      // create a new instance of the Room model
        room.name = req.body.name;  // set the rooms name (comes from the request)
        room.hostkey = generateKey();
        room.remotekey = generateKey();
        room.requestkey = generateKey();
        // save the room and check for errors
        room.save(function(err) {
            if (err)
                res.send(err);

            res.json({ message: 'Room created!' });
        });
        
    })
// get all the rooms (accessed at GET http://localhost:8080/api/rooms)
    .get(function(req, res) {
        Room.find(function(err, rooms) {
            if (err)
                res.send(err);

            res.json(rooms);
        });
    });

router.route('/rooms/:room_id')

    // get the room with that id (accessed at GET http://localhost:8080/api/rooms/:room_id)
    .get(function(req, res) {
        Room.findById(req.params.room_id, function(err, room) {
            if (err)
                res.send(err);
            res.json(room);
        });
    })
    .put(function(req, res) {

        // use our room model to find the room we want
        Room.findById(req.params.room_id, function(err, room) {

            if (err)
                res.send(err);

            room.playlist.push(req.body.track);  // update the rooms info

            // save the room
            room.save(function(err) {
                if (err)
                    res.send(err);

                res.json({ message: 'Room updated!' });
            });
            io.sockets.emit('room:update');

        });
    })
    .delete(function(req, res) {
        Room.remove({
            _id: req.params.room_id
        }, function(err, room) {
            if (err)
                res.send(err);

            res.json({ message: 'Successfully deleted' });
        });
    });

// more routes for our API will happen here

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

app.use(express.static(__dirname +  '/app'));

// START THE SERVER
// =============================================================================
var io = require('socket.io').listen(app.listen(port));
console.log('Magic happens on port ' + port);

//SOCKETZ
io.on('connection', function (socket) {
    socket.broadcast.emit('user connected');
    socket.on('ping',function(){
       console.log("pinged");
       socket.emit('pingback');
    });	
    socket.on('message', function (from, msg) {

      console.log('recieved message from', from, 'msg', JSON.stringify(msg));

      console.log('broadcasting message');
      console.log('payload is', msg);
      io.sockets.emit('broadcast', {
        payload: msg,
        source: from
      });
      console.log('broadcast complete');
    });
  });

// Misc. Functions
function generateKey() {
    return uuid.v4();
}