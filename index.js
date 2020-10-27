var ss = require('socket.io-stream');
var fs = require('fs');
const cors = require('cors');

require('dotenv').config();
const port = process.env.PORT || 5000;


var app = require('express')();
app.options('*', cors({
    origin: true,
    methods: 'POST',
    allowedHeaders: ['Content-Type'],
    credentials: true,
}));

var server = require('http').createServer(app);
var io = require('socket.io')(server, { 
    handlePreflightRequest: (req, res) => {
        const headers = {
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Origin": req.headers.origin, 
            "Access-Control-Allow-Credentials": true
        };
    res.writeHead(200, headers);
    res.end();
    }
});
io.origins((origin, callback) => {
  if (origin !== 'https://jrejoire.github.io') {
      return callback('origin not allowed', false);
  }
  callback(null, true);
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

server.listen(port, () => {
    console.log('Listening to port: ' + port);
});
