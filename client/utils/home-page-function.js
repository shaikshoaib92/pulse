export function generateRoomId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const arr = new Uint8Array(6);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => chars[b % chars.length]).join("");
}

export function joinRoom({ socket, email, roomId }) {
  if (!socket || !email || !roomId) return false;

  localStorage.setItem("callEmail", email);
  socket.emit("join-room", {
    emailId: email,
    roomId: roomId.toUpperCase(),
  });

  return true;
}

export function createRoom({ createEmail, roomName, setCreatedRoomId, setCreatedRoomName }) {
  if (!createEmail) return false;

  const newRoomId = generateRoomId();
  setCreatedRoomId(newRoomId);
  setCreatedRoomName(roomName);

  return true;
}

export function joinCreatedRoom({ socket, createEmail, createdRoomId, createdRoomName }) {
  if (!socket || !createEmail || !createdRoomId) return false;

  localStorage.setItem("callEmail", createEmail);
  socket.emit("join-room", {
    emailId: createEmail,
    roomId: createdRoomId,
    roomName: createdRoomName || undefined,
  });

  return true;
}

export async function copyRoomId({ createdRoomId, setCopied }) {
  if (!createdRoomId) return false;

  await navigator.clipboard.writeText(createdRoomId);
  setCopied(true);
  setTimeout(() => setCopied(false), 2000);

  return true;
}

export function resetRoomCreationState({
  setCreatedRoomId,
  setCreatedRoomName,
  setRoomName,
  setError,
}) {
  setCreatedRoomId("");
  setCreatedRoomName("");
  setRoomName("");
  setError("");
}

