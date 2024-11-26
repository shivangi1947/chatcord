const express = require("express");
const http = require("http");
const path = require("path");
const socketio = require("socket.io");
const formatMessage = require('./utils/message.js');
const { userJoin, getCurrentUser, getRoomUsers, userLeave } = require('./utils/users.js');

const app = express();
const port = 3000;
const server = http.createServer(app); // Create the HTTP server
const io = socketio(server); // Initialize socket.io with the HTTP server

app.use(express.static(path.join(__dirname, 'public')));

// Handle incoming connections
io.on('connection', (socket) => {
    console.log("A user connected");

    // When a user joins a room
    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room);
        socket.join(user.room);

        // Send welcome message to the user
        socket.emit('message', formatMessage('ChatCord', 'Welcome to ChatCord!'));

        // Broadcast to the room when a new user joins
        socket.broadcast.to(user.room).emit('message', formatMessage('ChatCord', `${user.username} has joined the chat`));

        // Send updated list of room users
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });

    // When a user sends a chat message
    socket.on('chatMessage', (msg) => {
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });

    // When a user disconnects
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if (user) {
            io.to(user.room).emit('message', formatMessage('ChatCord', `${user.username} has left the chat`));
        }

        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });
});

// Start the server
server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
