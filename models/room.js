// app/models/room.js

var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var RoomSchema   = new Schema({
    name: String,
    listeners: Number,
    hostkey: String,
    remotekey: String,
    requestkey: String,
    playlist: Array,
    requests: Array,
    history: Array
});

module.exports = mongoose.model('Room', RoomSchema);