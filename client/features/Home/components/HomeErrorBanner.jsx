export default function HomeErrorBanner({ error }) {
  if (!error) return null;

  return (
    <div className="px-6 py-3 bg-red-500/10 border-b border-red-500/20">
      <p className="text-red-400 text-sm text-center">{error}</p>
    </div>
  );
}
