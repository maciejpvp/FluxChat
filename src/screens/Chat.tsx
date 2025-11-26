import React, { useContext, useRef, useState, useEffect } from "react";
import { GlobalContext } from "../context/GlobalContext";
import { ChatMessage } from "../components/ChatMessage";
import {
  Send,
  Plus,
  Phone,
  PhoneOff,
  PhoneIncoming,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  Headphones,
  VolumeX,
} from "lucide-react";
import { generateId, abToBase64 } from "../utils/common";
import { Message } from "../types";

export const ChatScreen = () => {
  const {
    messages,
    addMessage,
    sendMessage,
    updateFileTransfer,
    voiceStatus,
    startVoiceCall,
    acceptVoiceCall,
    endVoiceCall,
    remoteAudioStream,
    localVideoStream,
    remoteVideoStream,
    toggleCamera,
    toggleScreenShare,
    isMuted,
    isDeafened,
    toggleMute,
    toggleDeaf,
  } = useContext(GlobalContext);

  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (remoteAudioStream && audioRef.current) {
      audioRef.current.srcObject = remoteAudioStream;
      audioRef.current.play().catch(console.error);
    }
  }, [remoteAudioStream]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isDeafened;
    }
  }, [isDeafened]);

  useEffect(() => {
    if (localVideoStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localVideoStream;
      localVideoRef.current.play().catch(console.error);
    }
  }, [localVideoStream]);

  useEffect(() => {
    if (remoteVideoStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteVideoStream;
      remoteVideoRef.current.play().catch(console.error);
    }
  }, [remoteVideoStream]);

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
        type: file.type,
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
      if (evt.target?.result) {
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
      }
    };
    const readNextChunk = () => {
      const slice = file.slice(offset, offset + CHUNK_SIZE);
      reader.readAsArrayBuffer(slice);
    };
    readNextChunk();
  };

  return (
    <div className="flex flex-col flex-1 max-w-4xl mx-auto w-full bg-stone-900 h-full relative">
      <audio ref={audioRef} className="hidden" />

      <div className="absolute top-0 left-0 right-0 z-20 flex flex-col gap-2">
        {voiceStatus !== "idle" && (
          <div className="bg-stone-800 border-b border-stone-700 p-3 flex items-center justify-between shadow-lg animate-in slide-in-from-top-4">
            <div className="flex items-center gap-3">
              <div className="bg-stone-700 p-2 rounded-full relative">
                <Mic size={20} className="text-white" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Voice Chat</h3>
                <p className="text-xs text-stone-400 flex items-center gap-1">
                  {voiceStatus === "calling" && "Calling..."}
                  {voiceStatus === "incoming" && "Incoming Call..."}
                  {voiceStatus === "connected" && "Connected"}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {voiceStatus === "connected" && (
                <>
                  <button
                    onClick={toggleMute}
                    className={`p-2 rounded-full transition ${isMuted
                      ? "bg-red-600 text-white"
                      : "bg-stone-700 text-white hover:bg-stone-600"
                      }`}
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                  </button>
                  <button
                    onClick={toggleDeaf}
                    className={`p-2 rounded-full transition ${isDeafened
                      ? "bg-red-600 text-white"
                      : "bg-stone-700 text-white hover:bg-stone-600"
                      }`}
                    title={isDeafened ? "Undeafen" : "Deafen"}
                  >
                    {isDeafened ? <VolumeX size={20} /> : <Headphones size={20} />}
                  </button>
                  <button
                    onClick={() => toggleCamera()}
                    className={`p-2 rounded-full transition ${localVideoStream
                      ? "bg-white text-stone-900"
                      : "bg-stone-700 text-white hover:bg-stone-600"
                      }`}
                    title="Toggle Camera"
                  >
                    {localVideoStream ? <Video size={20} /> : <VideoOff size={20} />}
                  </button>
                  <button
                    onClick={() => toggleScreenShare()}
                    className={`p-2 rounded-full transition ${localVideoStream?.getVideoTracks()[0]?.label.includes("screen")
                      ? "bg-white text-stone-900"
                      : "bg-stone-700 text-white hover:bg-stone-600"
                      }`}
                    title="Toggle Screen Share"
                  >
                    {localVideoStream?.getVideoTracks()[0]?.label.includes("screen") ? (
                      <Monitor size={20} />
                    ) : (
                      <MonitorOff size={20} />
                    )}
                  </button>
                </>
              )}
              {voiceStatus === "incoming" && (
                <button
                  onClick={acceptVoiceCall}
                  className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-full transition"
                >
                  <PhoneIncoming size={20} />
                </button>
              )}
              <button
                onClick={endVoiceCall}
                className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full transition"
              >
                <PhoneOff size={20} />
              </button>
            </div>
          </div>
        )}

        {(localVideoStream || remoteVideoStream) && (
          <div className="p-4 grid grid-cols-2 gap-4">
            {localVideoStream && (
              <div className="relative rounded-xl overflow-hidden bg-black aspect-video shadow-lg border border-stone-700">
                <video
                  ref={localVideoRef}
                  muted
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                />
                <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-xs text-white">
                  You
                </div>
              </div>
            )}
            {remoteVideoStream && (
              <div className="relative rounded-xl overflow-hidden bg-black aspect-video shadow-lg border border-stone-700">
                <video
                  ref={remoteVideoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                />
                <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-xs text-white">
                  Remote
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-stone-700 scrollbar-track-transparent pt-32">
        <div className="space-y-6 pb-4">
          {messages.length === 0 && (
            <div className="text-center text-stone-500 mt-20 text-sm">
              <p>Encrypted connection established.</p>
              <p>Say hello! 👋</p>
            </div>
          )}
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-4 border-t border-stone-800/50 backdrop-blur-lg">
        <form
          onSubmit={handleSendText}
          className="flex gap-2 items-end max-w-4xl mx-auto"
        >
          {voiceStatus === "idle" && (
            <button
              type="button"
              onClick={startVoiceCall}
              className="p-3 bg-stone-800 hover:bg-green-600 text-stone-300 hover:text-white rounded-xl transition-colors flex-shrink-0"
              title="Start Voice Chat"
            >
              <Phone size={20} />
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl transition-colors flex-shrink-0"
            title="Send File"
          >
            <Plus size={20} />
          </button>

          <div className="flex-1 relative">
            <input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full p-3 bg-stone-900 border border-stone-700 rounded-xl focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition-all text-stone-100 placeholder-stone-500"
              placeholder="Type a message..."
              autoComplete="off"
            />
          </div>

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-3 text-stone-950 rounded-xl bg-sky-500 disabled:opacity-50 transition-all font-bold flex-shrink-0"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};
