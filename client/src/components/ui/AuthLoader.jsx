import { Spinner } from "./Spinner";

export default function AuthLoader() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0d3545] text-white">
      {/* Subtle glowing background blobs */}
      <div className="absolute top-1/4 left-1/3 h-72 w-72 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 h-96 w-96 rounded-full bg-primary/20 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-6 px-4 text-center">
        {/* Brand Logo */}
        <div className="relative">
          <img
            src="/logo.png"
            alt="SR TAKAT"
            className="h-20 w-auto object-contain animate-pulse"
            style={{
              mixBlendMode: "screen",
              filter: "brightness(1.15) drop-shadow(0 4px 20px rgba(212,175,55,0.4))",
            }}
          />
        </div>

        {/* Brand Title & Subtitle */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">SR TAKAT</h1>
          <p className="text-xs font-semibold uppercase tracking-widest text-accent mt-1">
            Gem & Jewellery Management
          </p>
        </div>

        {/* Loading Spinner & Status Text */}
        <div className="flex items-center gap-3 mt-4 rounded-full bg-white/10 border border-white/15 px-5 py-2.5 backdrop-blur-md">
          <Spinner size={18} className="text-accent" />
          <span className="text-xs font-medium text-gray-200">Verifying session...</span>
        </div>
      </div>
    </div>
  );
}
