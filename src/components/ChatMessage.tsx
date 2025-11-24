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

  return (
    <div
      className={cn(
        "flex flex-col mb-3 max-w-[85%]",
        isMe ? "items-end self-end" : "items-start self-start",
      )}
    >
      <div className="text-[10px] text-stone-400 mb-1 px-1 flex gap-2">
        <span className="font-bold text-stone-300">
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
          "p-2 rounded-xl break-words text-sm",
          isMe
            ? "bg-stone-700 text-stone-100 rounded-tr-sm"
            : "bg-stone-800 text-stone-200 rounded-tl-sm",
        )}
      >
        {message.type === "TEXT" && (
          <p className="whitespace-pre-wrap leading-relaxed">
            {message.content}
          </p>
        )}

        {message.type === "FILE_INFO" && ft && (
          <div className="flex items-center gap-2 min-w-[200px] bg-stone-900/40 p-2 rounded-lg">
            <div className="bg-stone-800/50 p-2 rounded flex items-center justify-center">
              <Paperclip size={18} className="text-stone-200" />
            </div>

            <div className="flex-1 overflow-hidden min-w-0">
              <p className="font-semibold truncate text-stone-100 text-sm">
                {ft.name}
              </p>

              {/* Progress bar */}
              <div className="w-full bg-stone-700/50 h-1 rounded-full mt-1 overflow-hidden">
                <div
                  className="bg-stone-500 h-full transition-all duration-300"
                  style={{ width: `${(ft.receivedSize / ft.size) * 100}%` }}
                />
              </div>

              {/* Status */}
              <div className="flex justify-between items-center text-[10px] mt-1 text-stone-400">
                <span>{(ft.size / 1024).toFixed(1)} KB</span>
                {ft.status === "completed" ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle size={10} /> Done
                  </span>
                ) : (
                  <span>{Math.round((ft.receivedSize / ft.size) * 100)}%</span>
                )}
              </div>

              {/* Download button */}
              {ft.status === "completed" && ft.blobUrl && (
                <a
                  href={ft.blobUrl}
                  download={ft.name}
                  className="mt-2 flex items-center justify-center gap-1 w-full text-xs bg-stone-700 hover:bg-stone-600 text-stone-100 py-1 rounded transition-colors"
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
