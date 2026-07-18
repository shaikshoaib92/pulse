"use client";
import { usePeer } from "@/providers/Peer";
import { useSocket } from "@/providers/Socket";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

export default function Home() {
  const { socket } = useSocket();

  const [email, setEmail] = useState();
  const [roomId, setRoomId] = useState();

  const router = useRouter();

  useEffect(() => {
    if (!socket) return;
    socket.on("joined-room", handleRoomJoined);
    return () => {
      socket.off("joined-room", handleRoomJoined);
    };
  }, [socket]);

 

  const handleRoomJoined = useCallback(async ({ roomId }) => {
    router.push(`/loby/${roomId}`);
  }, []);

  const handleRoomJoin = () => {
    localStorage.setItem("callEmail", email);
    socket.emit("join-room", {
      emailId: email,
      roomId: roomId,
    });
  };

  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Join a room
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Enter your details to start connecting.
          </p>
        </div>

        <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-xl">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none transition focus:border-zinc-400"
          />

          <input
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Enter room id"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none transition focus:border-zinc-400"
          />

          <button
            className="w-full rounded-xl bg-white py-3 text-sm font-medium text-black transition hover:bg-zinc-200 active:scale-[0.98]"
            onClick={handleRoomJoin}
          >
            Join Room
          </button>
        </div>
      </div>
    </main>
  );
}
