"use client";
import { useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePeer } from "../../providers/Peer";
import { useSocket } from "@/providers/Socket";
import { useState } from "react";
import CallEndedBanner from "./components/CallEndedBanner";
import VideoStage from "./components/VideoStage";
import CallControls from "./components/CallControls";
import {
  clearStoredEmail,
  createMediaStream,
  getStoredEmail,
  stopMediaTracks,
} from "@/utils/room-page-function";

const Room = () => {
 const { peer, createOffer, createAnswer, setRemoteAns, handleRemoteOffer, sendStream, remoteStream, closeConnection } = usePeer();
  const [myStream, setMyStream] = useState(null);
  const [callEnded, setCallEnded] = useState(false);
  const [roomName, setRoomName] = useState(null);
  const [remoteEmail, setRemoteEmail] = useState(null);
  const remoteEmailIdRef = useRef(null);
  const streamRef = useRef(null);

  const param = useParams();
  const router = useRouter();
  const { socket } = useSocket();

  const updateRemoteEmailId = useCallback((email) => {
    remoteEmailIdRef.current = email;
    setRemoteEmail(email);
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
      stopMediaTracks(streamRef.current);
    }

    const stream = await createMediaStream();
    streamRef.current = stream;
    setMyStream(stream);
  }, []);

  const endCall = useCallback(() => {
    socket.emit("end-call", { roomId: param.roomid });

    if (myStream) {
      stopMediaTracks(myStream);
      setMyStream(null);
    }
    remoteEmailIdRef.current = null;
    closeConnection();
    clearStoredEmail();
    router.push("/");
  }, [socket, param.roomid, myStream, closeConnection, router]);

  const handleCallEnded = useCallback(() => {
    if (myStream) {
      stopMediaTracks(myStream);
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

  const handleRoomName = useCallback(({ roomName }) => {
    if (roomName) setRoomName(roomName);
  }, []);

  useEffect(() => {
  if (!socket) return;

  socket.on("user-joined", handleUserJoined);
  socket.on("incoming-call", handleIcommingCall);
  socket.on("call-accepted", handleCallAccepted);
  socket.on("nego-offer", handleNegoOffer);
  socket.on("nego-answer", handleNegoAnswer);
  socket.on("call-ended", handleCallEnded);
  socket.on("room-name", handleRoomName);

  const cleanup = () => {
    socket.off("user-joined", handleUserJoined);
    socket.off("incoming-call", handleIcommingCall);
    socket.off("call-accepted", handleCallAccepted);
    socket.off("nego-offer", handleNegoOffer);
    socket.off("nego-answer", handleNegoAnswer);
    socket.off("call-ended", handleCallEnded);
    socket.off("room-name", handleRoomName);
  };

  // Redirect to home if no stored email (user refreshed or direct access)
  const storedEmail = getStoredEmail();
  if (!storedEmail) {
    router.push("/");
    return cleanup;
  }

  // Fetch room name
  socket.emit("get-room-name", { roomId: param.roomid });

  // First-time join: join-room was already handled on home page
  socket.emit("ready", { roomId: param.roomid });

  return cleanup;
}, [socket, handleUserJoined, handleIcommingCall, handleCallAccepted, handleNegoOffer, handleNegoAnswer, handleCallEnded, handleRoomName, param.roomid, router]);

  useEffect(() => {
    let cancelled = false;

    const startMediaStream = async () => {
      if (cancelled) return;
      await getUserMediaStream();
    };

    void startMediaStream();

    return () => {
      cancelled = true;
    };
  }, [getUserMediaStream]);

  // Handle page refresh/close - clear session and stop tracks
  useEffect(() => {
    const handleBeforeUnload = () => {
      clearStoredEmail();
      if (myStream) {
        stopMediaTracks(myStream);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [myStream]);

  return (
    <div className="h-screen bg-[#0a0a0a] flex flex-col overflow-hidden">
      <CallEndedBanner visible={callEnded} onBackHome={() => router.push("/")} />

      <div className="flex-1 min-h-0 relative p-4 pb-0">
        <VideoStage remoteStream={remoteStream} myStream={myStream} remoteEmail={remoteEmail} />
      </div>

      <CallControls
        roomName={roomName}
        roomId={param.roomid}
        onSendStream={sendStream}
        onEndCall={endCall}
        myStream={myStream}
      />
    </div>
  );
};

export default Room;
