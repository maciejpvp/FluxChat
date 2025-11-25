import { Spline } from "lucide-react";

export const Header = ({ onBack }: { onBack?: () => void }) => (
  <header className="bg-stone-950/50 backdrop-blur border-b border-stone-800 p-4 shadow-md z-10">
    <div className="flex items-center gap-3">
      <button
        onClick={onBack}
        className="text-xl font-bold flex items-center gap-2 text-white tracking-tight"
      >
        <Spline className="text-accent fill-accent" size={24} />
        Flux
      </button>
    </div>
  </header>
);
