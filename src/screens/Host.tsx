import { useContext } from "react";
import { GlobalContext } from "../context/GlobalContext";
import { CopyBox } from "../components/CopyBox";
import { Loader2 } from "lucide-react";
import { CopyButton } from "../components/CopyButton";

export const HostScreen = () => {
  const { connectionCode, connectionStatus, completeConnection } =
    useContext(GlobalContext);

  return (
    <div className="flex flex-col items-center justify-center flex-1 p-6">
      <div className="w-full max-w-lg bg-stone-800/50 border border-stone-700 p-8 rounded-2xl shadow-xl flex flex-col gap-5">
        {connectionStatus === "generating" ? (
          <div className="py-12 flex flex-col items-center justify-center text-stone-400 gap-4">
            <Loader2 className="animate-spin text-accent" size={32} />
            <span>Generating secure keys...</span>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-bold mb-2 text-accent uppercase tracking-wider">
              Invite Code
            </label>
            <CopyButton value={connectionCode} />
          </div>
        )}

        <CopyBox
          label="Friend's Response Code"
          value=""
          readOnly={false}
          onPaste={(val) => completeConnection(val)}
        />
      </div>
    </div>
  );
};
