import React, { useContext, useRef, useEffect } from "react";
import { GlobalContext } from "../context/GlobalContext";
import { generateId, abToBase64 } from "../utils/common";
import { Message } from "../types";
import { VoiceCallBar } from "../components/chat/VoiceCallBar";
import { VideoGrid } from "../components/chat/VideoGrid";
import { MessageList } from "../components/chat/MessageList";
import { ChatInput } from "../components/chat/ChatInput";

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
    localScreenStream,
    remoteScreenStream,
    toggleCamera,
    toggleScreenShare,
    isMuted,
    isDeafened,
    toggleMute,
    toggleDeaf,
    remoteTypingText,
  } = useContext(GlobalContext);

  const audioRef = useRef<HTMLAudioElement>(null);

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

  const handleSendText = (text: string) => {
    const msg: Message = {
      id: generateId(),
      sender: "ME",
      type: "TEXT",
      timestamp: Date.now(),
      content: text,
    };
    sendMessage(msg);
    addMessage(msg);
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

  const handleTyping = (text: string) => {
    const msg: Message = {
      id: generateId(),
      sender: "ME",
      type: "TYPING",
      timestamp: Date.now(),
      content: text,
    };
    sendMessage(msg);
  };

  return (
    <div className="flex flex-col flex-1 max-w-4xl mx-auto w-full bg-stone-900 h-full relative">
      <audio ref={audioRef} className="hidden" />

      <div className="absolute top-0 left-0 right-0 z-20 flex flex-col gap-2">
        <VoiceCallBar
          voiceStatus={voiceStatus}
          isMuted={isMuted}
          isDeafened={isDeafened}
          localVideoStream={localVideoStream}
          localScreenStream={localScreenStream}
          toggleMute={toggleMute}
          toggleDeaf={toggleDeaf}
          toggleCamera={toggleCamera}
          toggleScreenShare={toggleScreenShare}
          acceptVoiceCall={acceptVoiceCall}
          endVoiceCall={endVoiceCall}
        />

        <VideoGrid
          localVideoStream={localVideoStream}
          remoteVideoStream={remoteVideoStream}
          localScreenStream={localScreenStream}
          remoteScreenStream={remoteScreenStream}
        />
      </div>

      <div className="flex-1 overflow-y-auto relative">
        <MessageList messages={messages} typingText={remoteTypingText} />
      </div>

      <ChatInput
        voiceStatus={voiceStatus}
        startVoiceCall={startVoiceCall}
        onSendText={handleSendText}
        onFileUpload={handleFileUpload}
        onTyping={handleTyping}
      />
    </div>
  );
};
