"use client";
import { useSocket } from "@/providers/Socket";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

function generateRoomId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const arr = new Uint8Array(6);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => chars[b % chars.length]).join("");
}

function CopyIcon({ className }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}

function CheckIcon({ className }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function Home() {
  const { socket } = useSocket();
  const router = useRouter();

  const [tab, setTab] = useState("join");
  const [email, setEmail] = useState("");
  const [roomId, setRoomId] = useState("");
  const [roomName, setRoomName] = useState("");
  const [createdRoomId, setCreatedRoomId] = useState("");
  const [createdRoomName, setCreatedRoomName] = useState("");
  const [copied, setCopied] = useState(false);
  const [createEmail, setCreateEmail] = useState("");
  const [error, setError] = useState("");

  const handleRoomJoined = useCallback(
    ({ roomId }) => {
      router.push(`/loby/${roomId}`);
    },
    [router]
  );

  useEffect(() => {
    if (!socket) return;
    socket.on("joined-room", handleRoomJoined);
    socket.on("room-full", ({ roomId }) => {
      setError(`Room ${roomId} is full. Only 2 participants are allowed.`);
    });
    return () => {
      socket.off("joined-room", handleRoomJoined);
      socket.off("room-full");
    };
  }, [socket, handleRoomJoined]);

  const handleJoinRoom = () => {
    if (!email || !roomId) return;
    localStorage.setItem("callEmail", email);
    socket.emit("join-room", {
      emailId: email,
      roomId: roomId.toUpperCase(),
    });
  };

  const handleCreateRoom = () => {
    if (!createEmail) return;
    const newRoomId = generateRoomId();
    setCreatedRoomId(newRoomId);
    setCreatedRoomName(roomName);
  };

  const handleJoinCreatedRoom = () => {
    localStorage.setItem("callEmail", createEmail);
    socket.emit("join-room", {
      emailId: createEmail,
      roomId: createdRoomId,
      roomName: createdRoomName || undefined,
    });
  };

  const handleCopyRoomId = async () => {
    await navigator.clipboard.writeText(createdRoomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateAnother = () => {
    setCreatedRoomId("");
    setCreatedRoomName("");
    setRoomName("");
    setError("");
  };

  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold tracking-tight text-white">
            Pulse
          </h1>
          <p className="mt-3 text-sm text-zinc-400">
            Quick Video Calling Application
          </p>
          <p className="mt-1.5 text-xs text-zinc-600">
            Supports up to 2 participants per room
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 shadow-xl overflow-hidden">
          {/* Error Banner */}
          {error && (
            <div className="px-6 py-3 bg-red-500/10 border-b border-red-500/20">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Tabs */}
          {!createdRoomId && (
            <div className="flex border-b border-zinc-800">
              <button
                onClick={() => { setTab("join"); setError(""); }}
                className={`flex-1 py-3.5 text-sm font-medium transition ${
                  tab === "join"
                    ? "text-white border-b-2 border-white"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Join Room
              </button>
              <button
                onClick={() => { setTab("create"); setError(""); }}
                className={`flex-1 py-3.5 text-sm font-medium transition ${
                  tab === "create"
                    ? "text-white border-b-2 border-white"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Create Room
              </button>
            </div>
          )}

          <div className="p-6">
            {/* Join Room Tab */}
            {tab === "join" && !createdRoomId && (
              <div className="space-y-4">
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
                  onClick={handleJoinRoom}
                  disabled={!email || !roomId}
                  className="w-full rounded-xl bg-white py-3 text-sm font-medium text-black transition hover:bg-zinc-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Join Room
                </button>
              </div>
            )}

            {/* Create Room Tab */}
            {tab === "create" && !createdRoomId && (
              <div className="space-y-4">
                <input
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none transition focus:border-zinc-400"
                />
                <input
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Room name (optional)"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none transition focus:border-zinc-400"
                />
                <button
                  onClick={handleCreateRoom}
                  disabled={!createEmail}
                  className="w-full rounded-xl bg-white py-3 text-sm font-medium text-black transition hover:bg-zinc-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Create Room
                </button>
              </div>
            )}

            {/* Created Room Result */}
            {createdRoomId && (
              <div className="space-y-5">
                {createdRoomName && (
                  <div className="text-center">
                    <span className="text-xs uppercase tracking-wider text-zinc-500">
                      Room Name
                    </span>
                    <p className="text-white font-medium mt-1">
                      {createdRoomName}
                    </p>
                  </div>
                )}

                <div className="text-center">
                  <span className="text-xs uppercase tracking-wider text-zinc-500">
                    Share this Room ID
                  </span>
                  <div className="mt-2 flex items-center justify-center gap-2">
                    <span className="text-3xl font-mono font-bold tracking-[0.25em] text-white">
                      {createdRoomId}
                    </span>
                    <button
                      onClick={handleCopyRoomId}
                      className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-zinc-300 transition hover:bg-zinc-700 hover:text-white active:scale-[0.97]"
                    >
                      {copied ? (
                        <>
                          <CheckIcon className="text-emerald-400" />
                          Copied
                        </>
                      ) : (
                        <>
                          <CopyIcon />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <button
                    onClick={handleJoinCreatedRoom}
                    className="w-full rounded-xl bg-white py-3 text-sm font-medium text-black transition hover:bg-zinc-200 active:scale-[0.98]"
                  >
                    Join Room
                  </button>
                  <button
                    onClick={handleCreateAnother}
                    className="w-full rounded-xl border border-zinc-700 py-3 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-white active:scale-[0.98]"
                  >
                    Create Another Room
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
