import { useState, useCallback } from "react";
import { AppMode, Message, FileTransfer } from "./types";
import { generateId, base64ToAb } from "./utils/common";
import { usePeerConnection } from "./hooks/usePeerConnection";
import { GlobalContext } from "./context/GlobalContext";
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

  const handleDataReceived = useCallback(
    (dataStr: string) => {
      try {
        const msg: Message = JSON.parse(dataStr);

        if (msg.type === "TEXT") {
          addMessage({ ...msg, sender: "STRANGER" });
        } else if (msg.type === "FILE_INFO" && msg.fileInfo) {
          // Init file download
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
          // Handle chunk
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
    [addMessage, updateFileTransfer],
  );

  const onConnected = useCallback(() => {
    setMode("CHAT");
  }, []);

  const {
    createConnection,
    completeConnection,
    sendMessage,
    connectionCode,
    connectionStatus,
  } = usePeerConnection(handleDataReceived, onConnected);

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
        sendMessage,
        connectionCode,
        connectionStatus,
      }}
    >
      <main className="flex-1 flex overflow-hidden relative">
        {mode === "HOME" && <HomeScreen />}
        {mode === "HOST" && <HostScreen />}
        {mode === "SLAVE" && <SlaveScreen />}
        {mode === "CHAT" && <ChatScreen />}
      </main>
    </GlobalContext.Provider>
  );
}
