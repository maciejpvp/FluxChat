import React, { useContext, useRef } from "react";
import { GlobalContext } from "../context/GlobalContext";
import { Loader2, Copy } from "lucide-react";

export const HostScreen = () => {
  const { connectionCode, connectionStatus, completeConnection } =
    useContext(GlobalContext);
  const pasteRef = useRef<HTMLInputElement>(null);

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const val = e.clipboardData.getData("text");
    if (val) completeConnection(val);
    if (pasteRef.current) pasteRef.current.value = "";
    e.preventDefault();
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 p-6 bg-stone-900">
      <div className="w-full max-w-sm bg-stone-800 border border-stone-700 p-6 rounded-2xl shadow-sm space-y-6">
        <div className="flex items-center justify-between gap-3">
          <span className="font-medium text-stone-100 text-sm">Your Code</span>
          {connectionStatus === "generating" ? (
            <Loader2 className="animate-spin text-stone-300" size={20} />
          ) : (
            <button
              onClick={() => navigator.clipboard.writeText(connectionCode)}
              className="bg-stone-700 p-1 rounded text-stone-200 hover:bg-stone-600 transition-colors flex items-center gap-1"
            >
              <Copy size={16} /> Copy
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="font-medium text-stone-100 text-sm">
            Friend's Code
          </span>
          <input
            ref={pasteRef}
            type="text"
            placeholder="Paste here"
            onPaste={handlePaste}
            className="bg-stone-700 text-stone-100 px-2 py-1 rounded w-32 text-sm focus:outline-none focus:ring-1 focus:ring-stone-500"
          />
        </div>
      </div>
    </div>
  );
};
