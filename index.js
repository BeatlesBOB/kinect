
const Kinect2 = require('kinect2');
const kinect = new Kinect2();
const { createServer } = require("http");

const httpServer = createServer();

const io = require("socket.io")(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const {disconnect} = require("./tools/disconnect")(io,kinect);
const {move} = require("./tools/move")(io,kinect);
const {touch} = require("./tools/touch")(io,kinect);

const onConnection = (socket) => {
    socket.on("disconnect", disconnect);
    socket.on("move", move);
    socket.on("touch", touch);
}
  
io.on("connection", onConnection);

io.listen(3000);

