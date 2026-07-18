"use client";
import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import {createPeer} from '../utils/peer-functions'

const PeerContext = React.createContext(null);
export const usePeer = () => React.useContext(PeerContext);

export const PeerProvider = (props) => {
  const [peer, setPeer] = useState(createPeer);
  const [remoteStream, setRemoteStream] = useState(null);

  
  
  const handleTracks = useCallback((event)=>{
      const streams = event.streams;
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

const sendStream = (stream) => {
  const existingTrackIds = new Set(
    peer.getSenders()
      .map(sender => sender.track?.id)
      .filter(Boolean)
  );
  stream.getTracks().forEach(track => {
    if (!existingTrackIds.has(track.id)) {
      peer.addTrack(track, stream);
    }
  });
};


const setRemoteAns = async (ans) => {
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

const closeConnection = () => {
  if(!peer) return
  if (peer) {
    peer.getSenders().forEach(sender => sender.track?.stop());
    peer.close();
    setRemoteStream(null)
    setPeer(createPeer)
  }
};

// Expose it in context
return (
  <PeerContext.Provider
    value={{ peer, createOffer, createAnswer, setRemoteAns, handleRemoteOffer, sendStream, remoteStream, closeConnection }}
  >
    {props.children}
  </PeerContext.Provider>
);
};
