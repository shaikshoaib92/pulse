export default function CallControls({ roomName, roomId, onSendStream, onEndCall, myStream }) {
  return (
    <div className="bg-[#111] border-t border-white/5 py-4 shrink-0">
      <div className="flex items-center justify-center gap-4">
        <div className="mr-4 text-right">
          {roomName && (
            <span className="text-white/50 text-xs font-medium block">{roomName}</span>
          )}
          <span className="text-white/30 text-xs">{roomId}</span>
        </div>

        <button
          onClick={() => onSendStream(myStream)}
          className="min-h-14 px-5 bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all rounded-full flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 text-white font-medium"
        >
          <svg
            className="w-5 h-5 text-white"
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
          <span>Share stream</span>
        </button>

        <button
          onClick={onEndCall}
          className="w-14 h-14 bg-red-600 hover:bg-red-500 active:scale-95 transition-all rounded-full flex items-center justify-center shadow-lg shadow-red-600/30"
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
  );
}
