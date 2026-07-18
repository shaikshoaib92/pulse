export default function CallEndedBanner({ visible, onBackHome }) {
  if (!visible) return null;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-4 backdrop-blur-sm">
      <p className="text-amber-400 font-medium text-sm">
        The other user has left the call.
      </p>
      <button
        onClick={onBackHome}
        className="px-4 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xs font-medium transition-all"
      >
        Back to Home
      </button>
    </div>
  );
}
