var fs = require("fs");
const https = require("https");
const privateKey = fs.readFileSync('ssl/creche.ipmaia.key', 'utf8');
const certificate = fs.readFileSync('ssl/creche.ipmaia.crt', 'utf8');
const x = fs.readFileSync('.')
var credentials = { key: privateKey, cert: certificate };

const express = require("express");
const app = express();

const server = https.createServer(credentials, app);

const { v4: uuidv4 } = require("uuid");
app.set("view engine", "ejs");
const io = require("socket.io")(server, {
    cors: {
        origin: '*'
    }
});
const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
    debug: true,
});

app.use("/peerjs", peerServer);
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.redirect(`/${uuidv4()}`);
});

app.get("/:room", (req, res) => {
    res.render("room", { roomId: req.params.room });
});

io.on("connection", (socket) => {
    socket.on("join-room", function (roomId, userId, userName) {
        socket.join(roomId);
        socket.to(roomId).broadcast.emit("user-connected", userId);
        socket.on("message", (message) => {
            io.to(roomId).emit("createMessage", message, userName);
        });
    });
});

server.listen(process.env.PORT || 8100);


