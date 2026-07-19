"use client";
import { useSocket } from "@/providers/Socket";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  copyRoomId,
  createRoom,
  joinCreatedRoom,
  joinRoom,
  resetRoomCreationState,
} from "@/utils/home-page-function";
import HomeHeader from "./components/HomeHeader";
import HomeErrorBanner from "./components/HomeErrorBanner";
import HomeTabs from "./components/HomeTabs";
import JoinRoomForm from "./components/JoinRoomForm";
import CreateRoomForm from "./components/CreateRoomForm";
import CreatedRoomView from "./components/CreatedRoomView";

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
    joinRoom({ socket, email, roomId });
  };

  const handleCreateRoom = () => {
    createRoom({
      createEmail,
      roomName,
      setCreatedRoomId,
      setCreatedRoomName,
    });
  };

  const handleJoinCreatedRoom = () => {
    joinCreatedRoom({
      socket,
      createEmail,
      createdRoomId,
      createdRoomName,
    });
  };

  const handleCopyRoomId = async () => {
    await copyRoomId({ createdRoomId, setCopied });
  };

  const handleCreateAnother = () => {
    resetRoomCreationState({
      setCreatedRoomId,
      setCreatedRoomName,
      setRoomName,
      setError,
    });
  };

  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <HomeHeader />

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 shadow-xl overflow-hidden">
          <HomeErrorBanner error={error} />

          {!createdRoomId && (
            <HomeTabs
              tab={tab}
              onTabChange={(nextTab) => {
                setTab(nextTab);
                setError("");
              }}
            />
          )}

          <div className="p-6">
            {tab === "join" && !createdRoomId && (
              <JoinRoomForm
                email={email}
                roomId={roomId}
                onEmailChange={setEmail}
                onRoomIdChange={setRoomId}
                onSubmit={handleJoinRoom}
                disabled={!email || !roomId}
              />
            )}

            {tab === "create" && !createdRoomId && (
              <CreateRoomForm
                createEmail={createEmail}
                roomName={roomName}
                onCreateEmailChange={setCreateEmail}
                onRoomNameChange={setRoomName}
                onSubmit={handleCreateRoom}
                disabled={!createEmail}
              />
            )}

            {createdRoomId && (
              <CreatedRoomView
                createdRoomId={createdRoomId}
                createdRoomName={createdRoomName}
                copied={copied}
                onCopy={handleCopyRoomId}
                onJoin={handleJoinCreatedRoom}
                onCreateAnother={handleCreateAnother}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}