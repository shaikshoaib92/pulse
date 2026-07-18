"use client";
import { useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePeer } from "../providers/Peer";
import { useSocket } from "@/providers/Socket";
import { useState } from "react";

const Loby = () => {
 const { peer, createOffer, createAnswer, setRemoteAns, handleRemoteOffer, sendStream, remoteStream, closeConnection } = usePeer();
  const [myStream, setMyStream] = useState(null);
  const [callEnded, setCallEnded] = useState(false);
  const remoteEmailIdRef = useRef(null);
  const streamRef = useRef(null);

  const param = useParams();
  const router = useRouter();
  const { socket } = useSocket();

  const updateRemoteEmailId = useCallback((email) => {
    remoteEmailIdRef.current = email;
  }, []);

  const handleIcommingCall = useCallback(
    async (data) => {
      const { from, offer } = data;
      const ans = await createAnswer(offer);
      socket.emit("call-accepted", { emailId: from, ans });
      updateRemoteEmailId(from); 
    },
    [createAnswer, socket, updateRemoteEmailId],
  );

  const handleUserJoined = useCallback(
    async (emailId) => {
      const offer = await createOffer();
      socket.emit("call-user", { emailId, offer });
      updateRemoteEmailId(emailId); 
    },
    [createOffer, socket, updateRemoteEmailId],
  );

  const handleCallAccepted = useCallback(
    async (data) => {
      const { ans } = data;
      await setRemoteAns(ans);
    },
    [setRemoteAns],
  );

  const getUserMediaStream = useCallback(async () => {
      if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
       }
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    streamRef.current = stream;
    setMyStream(stream);
  }, []);

  const endCall = useCallback(() => {
    socket.emit("end-call", { roomId: param.roomid });

    if (myStream) {
      myStream.getTracks().forEach(track => track.stop());
      setMyStream(null);
    }
    remoteEmailIdRef.current = null;
    closeConnection();
    localStorage.removeItem("callEmail");
    router.push("/");
  }, [socket, param.roomid, myStream, closeConnection, router]);

  const handleCallEnded = useCallback(() => {
    if (myStream) {
      myStream.getTracks().forEach(track => track.stop());
    }
    closeConnection();
    setCallEnded(true);
  }, [myStream, closeConnection]);

 // Negotiation handler — now emits a DIFFERENT event
const handleNegosiation = useCallback(async () => {
  if (!remoteEmailIdRef.current) return; // guard: don't negotiate before peer is known

  const offer = await peer.createOffer();
  await peer.setLocalDescription(offer);
  socket.emit("nego-offer", { emailId: remoteEmailIdRef.current, offer });
}, [peer, socket]);

// Handle incoming renegotiation offer (answerer side)
const handleNegoOffer = useCallback(async (data) => {
  const { from, offer } = data;
  const answer = await handleRemoteOffer(offer);
  socket.emit("nego-answer", { emailId: from, answer });
}, [handleRemoteOffer, socket]);

// Handle renegotiation answer (caller side)
const handleNegoAnswer = useCallback(async (data) => {
  const { answer } = data;
  await peer.setRemoteDescription(new RTCSessionDescription(answer));
}, [peer]);

  useEffect(() => {
    if(peer){
      peer.addEventListener("negotiationneeded", handleNegosiation);
    }
    return () => {
      if(peer){
        peer.removeEventListener("negotiationneeded", handleNegosiation);
      }
    };
  }, [peer, handleNegosiation]);

useEffect(() => {
  if (!socket) return;

  socket.on("user-joined", handleUserJoined);
  socket.on("incoming-call", handleIcommingCall);
  socket.on("call-accepted", handleCallAccepted);
  socket.on("nego-offer", handleNegoOffer);
  socket.on("nego-answer", handleNegoAnswer);
  socket.on("call-ended", handleCallEnded);

  const cleanup = () => {
    socket.off("user-joined", handleUserJoined);
    socket.off("incoming-call", handleIcommingCall);
    socket.off("call-accepted", handleCallAccepted);
    socket.off("nego-offer", handleNegoOffer);
    socket.off("nego-answer", handleNegoAnswer);
    socket.off("call-ended", handleCallEnded);
  };

  // Redirect to home if no stored email (user refreshed or direct access)
  const storedEmail = localStorage.getItem("callEmail");
  if (!storedEmail) {
    router.push("/");
    return cleanup;
  }

  // First-time join: join-room was already handled on home page
  socket.emit("ready", { roomId: param.roomid });

  return cleanup;
}, [socket, handleUserJoined, handleIcommingCall, handleCallAccepted, handleNegoOffer, handleNegoAnswer, handleCallEnded]);

  useEffect(() => {
    getUserMediaStream();
  }, [getUserMediaStream]);

  // Handle page refresh/close - clear session and stop tracks
  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.removeItem("callEmail");
      if (myStream) {
        myStream.getTracks().forEach(track => track.stop());
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [myStream]);

  return (
    <div className="h-screen bg-[#0a0a0a] flex flex-col overflow-hidden">
      {/* Notification Banner - Overlay */}
      {callEnded && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-4 backdrop-blur-sm">
          <p className="text-amber-400 font-medium text-sm">The other user has left the call.</p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xs font-medium transition-all"
          >
            Back to Home
          </button>
        </div>
      )}

      {/* Main Video Container */}
      <div className="flex-1 relative p-4 pb-0">
        {/* Remote Video - Full Size Background */}
        <div className="w-full h-full relative bg-[#111] rounded-t-2xl overflow-hidden border border-white/10">
          <video
            ref={(video) => {
              if (video) {
                video.srcObject = remoteStream;
              }
            }}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />

          {/* Remote User Label */}
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg">
            <span className="text-white/90 text-xs font-medium">Remote User</span>
          </div>

          {/* Local Video - Picture in Picture */}
          <div className="absolute bottom-4 right-4 w-48 md:w-64 aspect-video bg-[#1a1a1a] rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl">
            <video
              ref={(video) => {
                if (video) {
                  video.srcObject = myStream;
                }
              }}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Local User Label */}
            <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md">
              <span className="text-white/90 text-[10px] font-medium">You</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="bg-[#111] border-t border-white/5 py-4">
        <div className="flex items-center justify-center gap-4">
          {/* Room ID - Subtle */}
          <span className="text-white/30 text-xs mr-4">{param.roomid}</span>

          {/* Send Stream Button */}
          <button
            onClick={() => sendStream(myStream)}
            className="
              w-14 h-14
              bg-blue-600
              hover:bg-blue-500
              active:scale-95
              transition-all
              rounded-full
              flex
              items-center
              justify-center
              shadow-lg
              shadow-blue-600/30
            "
          >
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </button>

          {/* End Call Button */}
          <button
            onClick={endCall}
            className="
              w-14 h-14
              bg-red-600
              hover:bg-red-500
              active:scale-95
              transition-all
              rounded-full
              flex
              items-center
              justify-center
              shadow-lg
              shadow-red-600/30
            "
          >
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Loby;
