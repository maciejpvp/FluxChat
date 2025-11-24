import React, { useContext, useRef, useState, useEffect } from "react";
import { GlobalContext } from "../context/GlobalContext";
import { ChatMessage } from "../components/ChatMessage";
import { Send, Plus } from "lucide-react";
import { generateId, abToBase64 } from "../utils/common";
import { Message } from "../types";

export const ChatScreen = () => {
  const { messages, addMessage, sendMessage, updateFileTransfer } =
    useContext(GlobalContext);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const msg: Message = {
      id: generateId(),
      sender: "ME",
      type: "TEXT",
      timestamp: Date.now(),
      content: inputText,
    };
    sendMessage(msg);
    addMessage(msg);
    setInputText("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileId = generateId();

    const infoMsg: Message = {
      id: generateId(),
      sender: "ME",
      type: "FILE_INFO",
      timestamp: Date.now(),
      fileInfo: {
        id: fileId,
        name: file.name,
        size: file.size,
        mime: file.type,
      },
    };
    sendMessage(infoMsg);
    addMessage(infoMsg);
    updateFileTransfer(fileId, {
      id: fileId,
      name: file.name,
      size: file.size,
      receivedSize: 0,
      status: "uploading",
      chunks: [],
    });

    const CHUNK_SIZE = 16384;
    let offset = 0;
    let index = 0;
    const reader = new FileReader();

    reader.onload = (evt) => {
      if (!evt.target?.result) return;
      const chunk = evt.target.result as ArrayBuffer;
      const chunkMsg: Message = {
        id: generateId(),
        sender: "ME",
        type: "FILE_CHUNK",
        timestamp: Date.now(),
        chunk: {
          fileId,
          index,
          data: abToBase64(chunk),
        },
      };
      sendMessage(chunkMsg);
      offset += chunk.byteLength;
      index++;
      updateFileTransfer(fileId, { receivedSize: offset });

      if (offset < file.size) readNextChunk();
      else updateFileTransfer(fileId, { status: "completed" });
    };

    const readNextChunk = () => {
      const slice = file.slice(offset, offset + CHUNK_SIZE);
      reader.readAsArrayBuffer(slice);
    };

    readNextChunk();
  };

  return (
    <div className="flex flex-col flex-1 max-w-4xl mx-auto w-full bg-stone-900 h-full">
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-stone-700 scrollbar-track-transparent">
        <div className="space-y-4 pb-4">
          {messages.length === 0 && (
            <div className="text-center text-stone-500 mt-20 text-sm">
              <p>Encrypted connection established.</p>
            </div>
          )}
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-3 bg-stone-950 border-t border-stone-800">
        <form
          onSubmit={handleSendText}
          className="flex gap-2 items-center max-w-4xl mx-auto"
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded transition-colors flex-shrink-0"
            title="Send File"
          >
            <Plus size={18} />
          </button>

          <input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 p-2 bg-stone-900 border border-stone-700 rounded text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500 text-sm"
            placeholder="Type message..."
            autoComplete="off"
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2 bg-stone-700 hover:bg-stone-600 rounded text-stone-100 disabled:opacity-50 transition-colors flex-shrink-0"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};
