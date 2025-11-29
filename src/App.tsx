import { useState, useCallback, useEffect } from "react";
import { AppMode, Message, FileTransfer } from "./types";
import { generateId, base64ToAb } from "./utils/common";
import { usePeerConnection } from "./hooks/usePeerConnection";
import { useVoiceConnection } from "./hooks/useVoiceConnection";
import { useSoundEffects } from "./hooks/useSoundEffects";
import { GlobalContext } from "./context/GlobalContext";
import { Header } from "./components/Header";
import { HomeScreen } from "./screens/Home";
import { HostScreen } from "./screens/Host";
import { SlaveScreen } from "./screens/Slave";
import { ChatScreen } from "./screens/Chat";

export default function App() {
  const [mode, setMode] = useState<AppMode>("HOME");
  const [messages, setMessages] = useState<Message[]>([]);
  const [fileTransfers, setFileTransfers] = useState<
    Record<string, FileTransfer>
  >({});
  const [remoteTypingText, setRemoteTypingText] = useState<string | null>(null);

  const {
    playNotification,
    playRingtone,
    stopRingtone,
    playCallWait,
    stopCallWait,
  } = useSoundEffects();

  const addMessage = useCallback((msg: Message) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const updateFileTransfer = useCallback(
    (id: string, update: Partial<FileTransfer>) => {
      setFileTransfers((prev) => {
        const current = prev[id] || {
          id,
          name: "Unknown",
          size: 0,
          receivedSize: 0,
          chunks: [],
          status: "downloading",
        };
        return { ...prev, [id]: { ...current, ...update } };
      });
    },
    [],
  );

  const {
    createConnection,
    completeConnection,
    sendMessage: sendMainMessage,
    connectionCode,
    connectionStatus,
  } = usePeerConnection(
    (data) => handleDataReceived(data),
    () => setMode("CHAT"),
  );

  const {
    voiceStatus,
    startVoiceCall,
    acceptVoiceCall,
    endVoiceCall,
    handleIncomingOffer,
    handleIncomingAnswer,
    handleEndSignal,
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
  } = useVoiceConnection(sendMainMessage);

  const handleDataReceived = useCallback(
    (dataStr: string) => {
      try {
        const msg: Message = JSON.parse(dataStr);

        if (msg.type === "VOICE_SIGNAL" && msg.voiceSignal) {
          const vs = msg.voiceSignal;
          if (vs.type === "offer")
            handleIncomingOffer(vs.scope, vs.sdp!, vs.candidates || []);
          if (vs.type === "answer")
            handleIncomingAnswer(vs.scope, vs.sdp!, vs.candidates || []);
          if (vs.type === "end") handleEndSignal(vs.scope);
          return;
        }

        if (msg.type === "TYPING") {
          setRemoteTypingText(msg.content || null);
          return;
        }

        if (msg.type === "TEXT") {
          addMessage({ ...msg, sender: "STRANGER" });
          // Only play notification sound when page is not visible
          if (document.visibilityState === "hidden") {
            playNotification();
          }
        } else if (msg.type === "FILE_INFO" && msg.fileInfo) {
          updateFileTransfer(msg.fileInfo.id, {
            id: msg.fileInfo.id,
            name: msg.fileInfo.name,
            size: msg.fileInfo.size,
            status: "downloading",
            chunks: [],
            receivedSize: 0,
          });
          addMessage({
            id: generateId(),
            sender: "STRANGER",
            type: "FILE_INFO",
            timestamp: Date.now(),
            fileInfo: msg.fileInfo,
          });
        } else if (msg.type === "FILE_CHUNK" && msg.chunk) {
          setFileTransfers((prev) => {
            const ft = prev[msg.chunk!.fileId];
            if (!ft) return prev;

            const chunkData = base64ToAb(msg.chunk!.data);
            const newReceivedSize = ft.receivedSize + chunkData.byteLength;
            const newChunks = [...ft.chunks];
            newChunks[msg.chunk!.index] = chunkData;

            const isComplete = newReceivedSize >= ft.size;
            let blobUrl = undefined;

            if (isComplete) {
              const blob = new Blob(newChunks);
              blobUrl = URL.createObjectURL(blob);
            }

            return {
              ...prev,
              [ft.id]: {
                ...ft,
                receivedSize: newReceivedSize,
                chunks: newChunks,
                status: isComplete ? "completed" : "downloading",
                blobUrl,
              },
            };
          });
        }
      } catch (e) {
        console.error("Failed to parse message", e);
      }
    },
    [
      addMessage,
      updateFileTransfer,
      handleIncomingOffer,
      handleIncomingAnswer,
      handleEndSignal,
      playNotification,
    ],
  );

  // Handle voice call sounds
  useEffect(() => {
    if (voiceStatus === "incoming") {
      playRingtone();
    } else if (voiceStatus === "calling") {
      playCallWait();
    } else if (voiceStatus === "connected") {
      stopRingtone();
      stopCallWait();
    } else if (voiceStatus === "idle") {
      stopRingtone();
      stopCallWait();
    }
  }, [voiceStatus, playRingtone, stopRingtone, playCallWait, stopCallWait]);

  return (
    <GlobalContext.Provider
      value={{
        mode,
        setMode,
        messages,
        addMessage,
        fileTransfers,
        updateFileTransfer,
        createConnection,
        completeConnection,
        sendMessage: sendMainMessage,
        connectionCode,
        connectionStatus,
        remoteTypingText,
        // Voice
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
      }}
    >
      <Header onBack={() => setMode("HOME")} />
      <main className="flex-1 flex overflow-hidden relative bg-stone-900">
        {mode === "HOME" && <HomeScreen />}
        {mode === "HOST" && <HostScreen />}
        {mode === "SLAVE" && <SlaveScreen />}
        {mode === "CHAT" && <ChatScreen />}
      </main>
    </GlobalContext.Provider>
  );
}
