export const createPeer = () => {
  if (typeof window === "undefined" || typeof RTCPeerConnection === "undefined") {
    return null;
  }

  return new RTCPeerConnection({
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
};