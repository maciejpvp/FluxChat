import { useContext } from "react";
import { GlobalContext } from "../context/GlobalContext";
import { CopyBox } from "../components/CopyBox";
import { CopyButton } from "../components/CopyButton";

export const SlaveScreen = () => {
  const { createConnection, connectionCode } = useContext(GlobalContext);

  return (
    <div className="flex flex-col items-center justify-center flex-1 p-6">
      <div className="w-full max-w-lg bg-stone-800/50 border border-stone-700 p-8 rounded-2xl shadow-xl">
        {!connectionCode && (
          <CopyBox
            label="Paste Invitation Code"
            value=""
            readOnly={false}
            onPaste={(val) => createConnection("SLAVE", val)}
          />
        )}

        {connectionCode && (
          <div>
            <label className="block text-xs font-bold mb-2 text-accent uppercase tracking-wider">
              Response Code
            </label>
            <CopyButton value={connectionCode} />
          </div>
        )}
      </div>
    </div>
  );
};
