export function stopMediaTracks(stream) {
  if (!stream) return;

  stream.getTracks().forEach((track) => track.stop());
}

export function getStoredEmail() {
  return typeof window !== "undefined" ? localStorage.getItem("callEmail") : null;
}

export function clearStoredEmail() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("callEmail");
  }
}

export function createMediaStream() {
  return navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
  });
}
