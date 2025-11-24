import { useContext } from "react";
import { GlobalContext } from "../context/GlobalContext";
import { Zap, Radio, Users } from "lucide-react";

export const HomeScreen = () => {
  const { setMode, createConnection } = useContext(GlobalContext);

  return (
    <div className="flex flex-col items-center justify-center flex-1 p-6 bg-stone-900">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-stone-800 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-sm">
            <Zap size={36} className="text-stone-200" />
          </div>
          <h2 className="text-2xl font-medium text-stone-100">Flux</h2>
        </div>

        <div className="grid gap-4">
          <button
            onClick={() => {
              createConnection("HOST");
              setMode("HOST");
            }}
            className="flex items-center gap-3 p-4 rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-700 transition-colors"
          >
            <Radio size={22} className="text-stone-200" />
            <span className="font-medium text-stone-100">Host</span>
          </button>

          <button
            onClick={() => setMode("SLAVE")}
            className="flex items-center gap-3 p-4 rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-700 transition-colors"
          >
            <Users size={22} className="text-stone-300" />
            <span className="font-medium text-stone-100">Join</span>
          </button>
        </div>
      </div>
    </div>
  );
};
