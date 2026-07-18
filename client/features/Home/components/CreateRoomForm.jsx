export default function CreateRoomForm({
  createEmail,
  roomName,
  onCreateEmailChange,
  onRoomNameChange,
  onSubmit,
  disabled,
}) {
  return (
    <div className="space-y-4">
      <input
        value={createEmail}
        onChange={(e) => onCreateEmailChange(e.target.value)}
        placeholder="Enter your email"
        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none transition focus:border-zinc-400"
      />
      <input
        value={roomName}
        onChange={(e) => onRoomNameChange(e.target.value)}
        placeholder="Room name (optional)"
        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none transition focus:border-zinc-400"
      />
      <button
        onClick={onSubmit}
        disabled={disabled}
        className="w-full rounded-xl bg-white py-3 text-sm font-medium text-black transition hover:bg-zinc-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Create Room
      </button>
    </div>
  );
}
