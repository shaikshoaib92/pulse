const express = require("express");
const bodyparser = require("body-parser");
const { Server } = require("socket.io");

const io = new Server({
  cors: true,
});
const app = express();

const emailToSocketMapping = new Map();
const socketToEmailMapping = new Map();

io.on("connection", (socket) => {
  // Server
  socket.on("join-room", (data) => {
    const { roomId, emailId } = data;
    emailToSocketMapping.set(emailId, socket.id);
    socketToEmailMapping.set(socket.id, emailId);
    socket.join(roomId);
    socket.emit("joined-room", { roomId }); // ACK to joining user only
  });

  // Broadcast to others only when 2nd user confirms listeners are up
  socket.on("ready", ({ roomId }) => {
    socket.broadcast
      .to(roomId)
      .emit("user-joined", socketToEmailMapping.get(socket.id));
  });

  socket.on("call-user", (data) => {
    const { emailId, offer } = data;
    const socketId = emailToSocketMapping.get(emailId);
    console.log("sending incoming-call to:", socketId);
    const target = io.sockets.sockets.get(socketId);
    console.log("target socket exists:", target !== undefined);
    socket.to(socketId).emit("incoming-call", {
      from: socketToEmailMapping.get(socket.id),
      offer,
    });
  });

  socket.on("call-accepted", (data) => {
    const { emailId, ans } = data;
    const socketId = emailToSocketMapping.get(emailId);
    socket.to(socketId).emit("call-accepted", { ans });
  });

  socket.on("nego-offer", ({ emailId, offer }) => {
  const socketId = emailToSocketMapping.get(emailId); // however you look up sockets
  io.to(socketId).emit("nego-offer", { from: socket.data.email, offer });
});

socket.on("nego-answer", ({ emailId, answer }) => {
  const socketId = emailToSocketMapping.get(emailId);
  io.to(socketId).emit("nego-answer", { from: socket.data.email, answer });
});
});

const serverPORT = process.env.PORT || 8000;
const socketPort = process.env.PORT || 8001;

app.listen(serverPORT, "0.0.0.0",() => {
  console.log(`Server is running on port ${serverPORT}`);
});
io.listen(socketPort);
