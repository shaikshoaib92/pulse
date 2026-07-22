import { Check, Copy } from "lucide-react";

export default function CreatedRoomView({
  createdRoomId,
  createdRoomName,
  copied,
  onCopy,
  onJoin,
  onCreateAnother,
}) {
  return (
    <div className="space-y-5">
      {createdRoomName && (
        <div className="text-center">
          <span className="text-xs uppercase tracking-wider text-zinc-500">
            Room Name
          </span>
          <p className="text-white font-medium mt-1">{createdRoomName}</p>
        </div>
      )}

      <div className="text-center">
        <span className="text-xs uppercase tracking-wider text-zinc-500">
          Share this Room ID
        </span>
        <div className="mt-2 flex items-center justify-center gap-2">
          <span className="text-3xl font-mono font-bold tracking-[0.25em] text-white">
            {createdRoomId}
          </span>
          <button
            onClick={onCopy}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-zinc-300 transition hover:bg-zinc-700 hover:text-white active:scale-[0.97]"
          >
            {copied ? (
              <>
                <Check className="text-emerald-400" />
                Copied
              </>
            ) : (
              <>
                <Copy />
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <button
          onClick={onJoin}
          className="w-full rounded-xl bg-white py-3 text-sm font-medium text-black transition hover:bg-zinc-200 active:scale-[0.98]"
        >
          Join Room
        </button>
        {/* <button
          onClick={onCreateAnother}
          className="w-full rounded-xl border border-zinc-700 py-3 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-white active:scale-[0.98]"
        >
          Create Another Room
        </button> */}
      </div>
    </div>
  );
}
