import { useContext } from "react";
import { Paperclip, Download, CheckCircle } from "lucide-react";
import { Message } from "../types";
import { GlobalContext } from "../context/GlobalContext";
import { cn } from "../utils/common";

export const ChatMessage = ({ message }: { message: Message }) => {
  const { fileTransfers } = useContext(GlobalContext);
  const isMe = message.sender === "ME";
  const ft =
    message.type === "FILE_INFO" && message.fileInfo
      ? fileTransfers[message.fileInfo.id]
      : null;

  if (message.type === "VOICE_SIGNAL") {
    return null;
  }

  return (
    <div
      className={cn(
        "flex flex-col mb-4 max-w-[85%]",
        isMe ? "items-end self-end" : "items-start self-start",
      )}
    >
      <div className="text-[10px] text-stone-500 mb-1 px-1 flex gap-2">
        <span className="font-bold text-stone-400">
          {isMe ? "You" : "Friend"}
        </span>
        <span>
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>

      <div
        className={cn(
          "p-3 rounded-2xl shadow-sm break-words",
          isMe
            ? "bg-sky-800 text-white rounded-tr-sm"
            : "bg-sky-800 text-stone-200 rounded-tl-sm",
        )}
      >
        {message.type === "TEXT" && (
          <p className="whitespace-pre-wrap leading-relaxed text-sm">
            {message.content}
          </p>
        )}

        {message.type === "FILE_INFO" && ft && (
          <div className="flex items-center gap-3 min-w-[240px] bg-black/20 p-2 rounded-xl">
            <div className="bg-stone-950/50 p-3 rounded-lg">
              <Paperclip size={20} className="text-accent" />
            </div>
            <div className="flex-1 overflow-hidden min-w-0">
              <p className="font-bold truncate text-sm text-stone-100">
                {ft.name}
              </p>

              <div className="w-full bg-black/30 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-accent h-full transition-all duration-300"
                  style={{ width: `${(ft.receivedSize / ft.size) * 100}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[10px] mt-1 text-stone-300">
                <span>{(ft.size / 1024).toFixed(1)} KB</span>
                {ft.status === "completed" ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle size={10} /> Done
                  </span>
                ) : (
                  <span>{Math.round((ft.receivedSize / ft.size) * 100)}%</span>
                )}
              </div>

              {ft.status === "completed" && ft.blobUrl && (
                <a
                  href={ft.blobUrl}
                  download={ft.name}
                  className="mt-2 flex items-center justify-center gap-2 w-full text-xs bg-stone-700 hover:bg-stone-600 text-white py-1.5 rounded-md transition-colors"
                >
                  <Download size={12} /> Download
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
