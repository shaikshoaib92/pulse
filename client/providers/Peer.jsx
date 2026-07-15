"use client";
import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";

const PeerContext = React.createContext(null);
export const usePeer = () => React.useContext(PeerContext);

export const PeerProvider = (props) => {
  const [peer, setPeer] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);


  useEffect(() => {
    const pc = new RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        },
        {
          urls: "turn:openrelay.metered.ca:80",
          username: "openrelayproject",
          credential: "openrelayproject",
        },
      ],
    });
    setPeer(pc);
    return () => {
      pc.close();
    };
  }, []);


  
  
  
  const handleTracks = useCallback((event)=>{
      const streams = event.streams;
      console.log(streams,"Streams");
      
      setRemoteStream(streams[0])
    },[])


    useEffect(()=>{
        if(!peer) return
      peer.addEventListener('track',handleTracks)
      
      return ()=>{
          peer.removeEventListener('track',handleTracks )
      }
    },[ handleTracks,peer])

  const createOffer = async () => {
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    return offer;
  };

  const isNegotiating = useRef(false);

  const createAnswer = async (offer) => {
    if (isNegotiating.current) {
      console.warn("Already negotiating, ignoring duplicate call");
      return;
    }

    isNegotiating.current = true;

    try {
      await peer.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      return answer;
    } finally {
      isNegotiating.current = false;
    }
  };

  const sendStream = async (stream) => {
    const tracks = stream.getTracks();
    for (const track of tracks) {
      peer.addTrack(track, stream);
    }
  };

//   const setRemoteAns = async (ans) => {
//     await peer.setRemoteDescription(new RTCSessionDescription(ans));
//   };

const setRemoteAns = async (ans) => {
  console.log("setRemoteAns called, state:", peer.signalingState);
  if (peer.signalingState !== "have-local-offer") {
    console.warn("Wrong state for setRemoteAns:", peer.signalingState);
    return;
  }
  await peer.setRemoteDescription(new RTCSessionDescription(ans));
};

// Add this new method
const handleRemoteOffer = async (offer) => {
  await peer.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peer.createAnswer();
  await peer.setLocalDescription(answer);
  return answer;
};

// Expose it in context
return (
  <PeerContext.Provider
    value={{ peer, createOffer, createAnswer, setRemoteAns, handleRemoteOffer, sendStream, remoteStream }}
  >
    {props.children}
  </PeerContext.Provider>
);
};
