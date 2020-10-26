var express = require('express');
const cors = require("cors");
const socketIo = require("socket.io");
var ss = require('socket.io-stream');
var fs = require('fs');

require('dotenv').config();
const port = process.env.PORT || 5000;

const app = express();

app.use(express.json());

const whitelist = ["https://jrejoire.github.io", "https://jrejoire.github.io/*", "http://localhost:3000", "http://localhost:3000/*"];
var corsOptions = {
    origin: function (origin, callback) {
        if (whitelist.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    }
}
app.use(cors(corsOptions));
var server = app.listen(port, () => console.log(`Listening to server ${port}`));

var io = socketIo.listen(server);
io.configure('production', function () {
    console.log("Server in production mode");
    io.enable('browser client minification');  // send minified client
    io.enable('browser client etag'); // apply etag caching logic based on version number
    io.enable('browser client gzip'); // the file
    io.set('log level', 1);           // logging
    io.set('transports', [            // all transports
        'websocket'
        , 'flashsocket'
        , 'htmlfile'
        , 'xhr-polling'
        , 'jsonp-polling'
    ]);
    io.set('origins', 'https://jrejoire.github.io:*');
});
io.on("connection", function (socket) {
    // client has connected
    console.log("Client connected");

    socket.on("disconnect", function () {
        console.log("Client disconnected");
    });

    ss(socket).on('file', function (stream, data, callback) {
        const img = data.content;
        const buffer = Buffer.from(img.substring(img.indexOf(',') + 1));
        const byteSize = buffer.length;
        const MBSize = (byteSize / (1024 * 1024)).toFixed(2);
        //Multiplying megabyte size by 8 for the megabit size;
        const MbSize = MBSize * 8;
        console.log("Byte length: " + byteSize);
        console.log("MB: " + MBSize);

        ss(socket).emit('dataUpload', MbSize, data.timestamp)

        callback({
            name: data.name,
            content: data.content,
            size: MbSize,
            timestamp: data.timestamp
        });

        var MyFileStream = fs.createReadStream('./assets/sample_data.jpg');
        MyFileStream.pipe(stream);
    })
});

app.get('/', async (req, res) => {
    res.send('App init');
});