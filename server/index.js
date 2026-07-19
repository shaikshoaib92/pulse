const express = require("express");
const bodyparser = require("body-parser");
const { Server } = require("socket.io");
const { createServer } = require("http");
const { createClient } = require("redis");


const redis = createClient();

redis.on("error", (err) => console.error(err));

(async () => {
  await redis.connect();
  console.log("Connected to Redis");
})();

const EMAIL_TO_SOCKET_MAPPING='email-to-socket-mapping';
const SOCKET_TO_EMAIL_MAPPING='socket-to-email-mapping';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*", // tighten this later
  },
});




io.on("connection", (socket) => {
  // Server
  socket.on("join-room", async (data) => {
    const roomId = String(data.roomId);
    const emailId = String(data.emailId);
    const roomName = data.roomName ? String(data.roomName) : null;
    // Clean up old socket mapping if email already exists (re-join / refresh)
    const oldSocketId = await redis.get(emailId);
    if (oldSocketId && oldSocketId !== socket.id) {
      await redis.del(oldSocketId);
    }
    await redis.set(emailId, socket.id, { EX: 1800 });
    await redis.set(socket.id, emailId, { EX: 1800 });
    await redis.set(`${socket.id}:room`, roomId, { EX: 1800 });
    if (roomName) {
      await redis.set(`room:${roomId}`, roomName, { EX: 1800 });
    }
    socket.join(roomId);
    // Enforce max 2 users per room
    const room = io.sockets.adapter.rooms.get(roomId);
    if (room && room.size > 2) {
      socket.leave(roomId);
      await redis.del(emailId);
      await redis.del(socket.id);
      await redis.del(`${socket.id}:room`);
      if (roomName) {
        await redis.del(`room:${roomId}`);
      }
      socket.emit("room-full", { roomId });
      return;
    }
    socket.emit("joined-room", { roomId });
  });

  socket.on("get-room-name", async ({ roomId }) => {
    const roomName = await redis.get(`room:${roomId}`);
    socket.emit("room-name", { roomId, roomName: roomName || null });
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
    const target = io.sockets.sockets.get(socketId);
    socket.to(socketId).emit("incoming-call", {
      from: fromEmail,
      offer,
    });
  });

  socket.on("call-accepted", async(data) => {
    const { emailId, ans } = data;
    const socketId = await redis.get(emailId);
    socket.to(socketId).emit("call-accepted", { ans });
  });

  socket.on("nego-offer", async({ emailId, offer }) => {
    const socketId = await redis.get(emailId);
    const fromEmail = await redis.get(socket.id);
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
    // Clean up room name if room is empty
    const room = io.sockets.adapter.rooms.get(roomId);
    if (!room || room.size === 0) {
      await redis.del(`room:${roomId}`);
    }
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
    // Clean up room name if room is empty
    if (roomId) {
      const room = io.sockets.adapter.rooms.get(roomId);
      if (!room || room.size === 0) {
        await redis.del(`room:${roomId}`);
      }
    }
  });
});

const serverPORT = process.env.PORT || 8000;

httpServer.listen(serverPORT, "0.0.0.0", () => {
  console.log(`Server and socket server running on http://0.0.0.0:${serverPORT}`);
});
