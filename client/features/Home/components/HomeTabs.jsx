export default function HomeTabs({ tab, onTabChange }) {
  return (
    <div className="flex border-b border-zinc-800">
      <button
        onClick={() => onTabChange("join")}
        className={`flex-1 py-3.5 text-sm font-medium transition ${
          tab === "join"
            ? "text-white border-b-2 border-white"
            : "text-zinc-500 hover:text-zinc-300"
        }`}
      >
        Join Room
      </button>
      <button
        onClick={() => onTabChange("create")}
        className={`flex-1 py-3.5 text-sm font-medium transition ${
          tab === "create"
            ? "text-white border-b-2 border-white"
            : "text-zinc-500 hover:text-zinc-300"
        }`}
      >
        Create Room
      </button>
    </div>
  );
}
