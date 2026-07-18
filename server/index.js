const express = require("express");
const bodyparser = require("body-parser");
const { Server } = require("socket.io");
const fs = require("fs");
const { createServer } = require("https");
const { createClient } = require("redis");


const redis = createClient();

redis.on("error", (err) => console.error(err));

(async () => {
  await redis.connect();
  console.log("Connected to Redis");
})();

const EMAIL_TO_SOCKET_MAPPING='email-to-socket-mapping';
const SOCKET_TO_EMAIL_MAPPING='socket-to-email-mapping';

const httpsServer = createServer({
  key: fs.readFileSync("./192.168.1.5+2-key.pem"),
  cert: fs.readFileSync("./192.168.1.5+2.pem"),
});

const io = new Server(httpsServer, {
  cors: {
    origin: "*", // tighten this later
  },
});

const app = express();




io.on("connection", (socket) => {
  // Server
  socket.on("join-room", async (data) => {
    const roomId = String(data.roomId);
    const emailId = String(data.emailId);
    // Clean up old socket mapping if email already exists (re-join / refresh)
    const oldSocketId = await redis.get(emailId);
    if (oldSocketId && oldSocketId !== socket.id) {
      await redis.del(oldSocketId);
    }
    await redis.set(emailId, socket.id);
    await redis.set(socket.id, emailId);
    await redis.set(`${socket.id}:room`, roomId);
    socket.join(roomId);
    socket.emit("joined-room", { roomId });
  });

  // Broadcast to others only when 2nd user confirms listeners are up
  socket.on("ready", async ({ roomId }) => {
    const joinedUser = await redis.get(socket.id)
    socket.broadcast
      .to(roomId)
      .emit("user-joined", joinedUser);
      // socketToEmailMapping.get(socket.id)
  });

  socket.on("call-user", async(data) => {
    const { emailId, offer } = data;
    const socketId = await redis.get(emailId);
    const fromEmail = await redis.get(socket.id)
    // const socketId = emailToSocketMapping.get(emailId);
    console.log("sending incoming-call to:", socketId);
    const target = io.sockets.sockets.get(socketId);
    console.log("target socket exists:", target !== undefined);
    socket.to(socketId).emit("incoming-call", {
      from: fromEmail,
      offer,
    });
  });

  socket.on("call-accepted", async(data) => {
    const { emailId, ans } = data;
    const socketId = await redis.get(emailId);
    // const socketId = emailToSocketMapping.get(emailId);
    socket.to(socketId).emit("call-accepted", { ans });
  });

  socket.on("nego-offer", async({ emailId, offer }) => {
    const socketId = await redis.get(emailId);
    const fromEmail = await redis.get(socket.id);
  // const socketId = emailToSocketMapping.get(emailId);

  io.to(socketId).emit("nego-offer", { from: fromEmail, offer });
});

socket.on("nego-answer", async ({ emailId, answer }) => {
  const socketId = await redis.get(emailId);
  const fromEmail = await redis.get(socket.id);
  io.to(socketId).emit("nego-answer", { from: fromEmail, answer });
});

  socket.on("end-call", async ({ roomId }) => {
    const emailId = await redis.get(socket.id);
    // Notify the other user in the room
    socket.broadcast.to(roomId).emit("call-ended", { from: emailId });
    // Clean up Redis
    if (emailId) await redis.del(emailId);
    await redis.del(socket.id);
    await redis.del(`${socket.id}:room`);
    socket.leave(roomId);
  });

  socket.on("disconnect", async () => {
    const emailId = await redis.get(socket.id);
    const roomId = await redis.get(`${socket.id}:room`);
    // Only clean up email mapping if we're still the current socket for this email
    if (emailId) {
      const currentSocketId = await redis.get(emailId);
      if (currentSocketId === socket.id) {
        await redis.del(emailId);
      }
    }
    if (roomId && emailId) {
      socket.broadcast.to(roomId).emit("call-ended", { from: emailId });
    }
    await redis.del(socket.id);
    await redis.del(`${socket.id}:room`);
  });
});

const serverPORT = process.env.PORT || 8000;
const socketPort = process.env.PORT || 8001;

app.listen(serverPORT, "0.0.0.0",() => {
  console.log(`Server is running on port ${serverPORT}`);
});
httpsServer.listen(socketPort, "0.0.0.0", () => {
  console.log(`Socket server running on https://0.0.0.0:${socketPort}`);
});
