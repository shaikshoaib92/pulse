export default function VideoStage({ remoteStream, myStream, remoteEmail }) {
  return (
    <div className="w-full h-full min-h-0 relative bg-[#111] rounded-t-2xl overflow-hidden border border-white/10">
      <video
        ref={(video) => {
          if (video) {
            video.srcObject = remoteStream;
          }
        }}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />

      <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg">
        <span className="text-white/90 text-xs font-medium">
          {remoteEmail || "Remote User"}
        </span>
      </div>

      <div className="absolute bottom-4 right-4 w-36 h-24 md:w-56 md:h-32 lg:w-64 lg:h-36 bg-[#1a1a1a] rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl">
        <video
          ref={(video) => {
            if (video) {
              video.srcObject = myStream;
            }
          }}
          autoPlay
          playsInline
          muted
          className="w-full h-full max-h-full object-cover"
        />
        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md">
          <span className="text-white/90 text-[10px] font-medium">You</span>
        </div>
      </div>
    </div>
  );
}
