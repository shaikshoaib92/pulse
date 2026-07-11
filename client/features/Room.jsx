"use client";
import { useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { usePeer } from "../providers/Peer";
import { useSocket } from "@/providers/Socket";
import ReactPlayer from "react-player";
import { useState } from "react";

const Loby = () => {
 const { peer, createOffer, createAnswer, setRemoteAns, handleRemoteOffer, sendStream, remoteStream } = usePeer();
  const [myStream, setMyStream] = useState(null);
  const [remoteEmailId, setRemoteEmailId] = useState(null);
  const remoteEmailIdRef = useRef(null);

  const param = useParams();
  const { socket } = useSocket();

  const updateRemoteEmailId = useCallback((email) => {
    remoteEmailIdRef.current = email;
    setRemoteEmailId(email);
  }, []);

  const handleIcommingCall = useCallback(
    async (data) => {
      const { from, offer } = data;
      const ans = await createAnswer(offer);
      socket.emit("call-accepted", { emailId: from, ans });
      updateRemoteEmailId(from); // <-- was setRemoteEmailId
    },
    [createAnswer, socket, updateRemoteEmailId],
  );

  const handleUserJoined = useCallback(
    async (emailId) => {
      const offer = await createOffer();
      socket.emit("call-user", { emailId, offer });
      updateRemoteEmailId(emailId); // <-- was setRemoteEmailId
    },
    [createOffer, socket, updateRemoteEmailId],
  );

  const handleCallAccepted = useCallback(
    async (data) => {
      const { ans } = data;
      await setRemoteAns(ans);
      console.log("Call got accepted", ans);
    },
    [setRemoteAns],
  );

  const getUserMediaStream = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    // sendStream(stream)
    setMyStream(stream);
  }, []);

 // Negotiation handler — now emits a DIFFERENT event
const handleNegosiation = useCallback(async () => {
  console.log("Nego needed, remote:", remoteEmailIdRef.current);
  if (!remoteEmailIdRef.current) return; // guard: don't negotiate before peer is known

  const offer = await peer.createOffer();
  await peer.setLocalDescription(offer);
  socket.emit("nego-offer", { emailId: remoteEmailIdRef.current, offer });
}, [peer, socket]);

// Handle incoming renegotiation offer (answerer side)
const handleNegoOffer = useCallback(async (data) => {
  const { from, offer } = data;
  console.log("Received nego-offer from:", from);
  const answer = await handleRemoteOffer(offer);
  socket.emit("nego-answer", { emailId: from, answer });
}, [handleRemoteOffer, socket]);

// Handle renegotiation answer (caller side)
const handleNegoAnswer = useCallback(async (data) => {
  const { answer } = data;
  console.log("Received nego-answer, state:", peer.signalingState);
  await peer.setRemoteDescription(new RTCSessionDescription(answer));
}, [peer]);

  useEffect(() => {
    peer.addEventListener("negotiationneeded", handleNegosiation);
    return () => {
      peer.removeEventListener("negotiationneeded", handleNegosiation);
    };
  }, [peer, handleNegosiation]); // <-- was []

useEffect(() => {
  if (!socket) return;

  socket.on("user-joined", handleUserJoined);
  socket.on("incoming-call", handleIcommingCall);
  socket.on("call-accepted", handleCallAccepted);
  socket.on("nego-offer", handleNegoOffer);       // NEW
  socket.on("nego-answer", handleNegoAnswer);     // NEW

  socket.emit("ready", { roomId: param.roomid });

  return () => {
    socket.off("user-joined", handleUserJoined);
    socket.off("incoming-call", handleIcommingCall);
    socket.off("call-accepted", handleCallAccepted);
    socket.off("nego-off", handleNegoOffer);      // NEW
    socket.off("nego-answer", handleNegoAnswer);  // NEW
  };
}, [socket, handleUserJoined, handleIcommingCall, handleCallAccepted, handleNegoOffer, handleNegoAnswer]);

  useEffect(() => {
    getUserMediaStream();
  }, [getUserMediaStream]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black flex flex-col items-center justify-center p-6">
      {/* Header */}
      <div className="w-full max-w-6xl flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Video Room</h1>
          <p className="text-slate-400 text-sm">
            User joined room:
            <span className="text-blue-400 ml-1">{param.roomid}</span>
          </p>
        </div>

        <button
          onClick={() => {
            sendStream(myStream);
            console.log("remoteEmailId", remoteEmailId);
          }}
          className="
        px-6 py-3
        bg-blue-600 
        hover:bg-blue-700
        active:scale-95
        transition-all
        rounded-xl
        text-white
        font-medium
        shadow-lg
        shadow-blue-600/30
      "
        >
          Send My Stream
        </button>
      </div>

      {/* Video Container */}
      <div
        className="
      w-full
      max-w-6xl
      grid
      md:grid-cols-2
      gap-6
    "
      >
        {/* My Video */}
        <div
          className="
        relative
        bg-slate-800
        rounded-2xl
        overflow-hidden
        shadow-2xl
        border
        border-slate-700
      "
        >
          <span
            className="
          absolute
          top-4
          left-4
          z-10
          bg-black/50
          backdrop-blur
          px-3
          py-1
          rounded-full
          text-xs
          text-white
        "
          >
            You
          </span>

          <video
            ref={(video) => {
              if (video) {
                video.srcObject = myStream;
              }
            }}
            autoPlay
            playsInline
            muted
            className="
          w-full
          aspect-video
          object-cover
        "
          />
        </div>

        {/* Remote Video */}
        <div
          className="
        relative
        bg-slate-800
        rounded-2xl
        overflow-hidden
        shadow-2xl
        border
        border-slate-700
      "
        >
          <span
            className="
          absolute
          top-4
          left-4
          z-10
          bg-black/50
          backdrop-blur
          px-3
          py-1
          rounded-full
          text-xs
          text-white
        "
          >
            Remote User
          </span>

          <video
            ref={(video) => {
              if (video) {
                video.srcObject = remoteStream;
              }
            }}
            autoPlay
            playsInline
            className="
          w-full
          aspect-video
          object-cover
        "
          />
        </div>
      </div>
    </div>
  );
};

export default Loby;
