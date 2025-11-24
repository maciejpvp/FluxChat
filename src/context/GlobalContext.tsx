import { createContext } from "react";
import { Message, FileTransfer, AppMode } from "../types";

interface GlobalContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  messages: Message[];
  addMessage: (msg: Message) => void;
  fileTransfers: Record<string, FileTransfer>;
  updateFileTransfer: (id: string, update: Partial<FileTransfer>) => void;
  createConnection: (
    mode: "HOST" | "SLAVE",
    remoteCode?: string,
  ) => Promise<void>;
  completeConnection: (answerCode: string) => Promise<void>;
  sendMessage: (payload: any) => Promise<void>;
  connectionCode: string;
  connectionStatus: "idle" | "generating" | "waiting" | "connected";
}

export const GlobalContext = createContext<GlobalContextType>(
  {} as GlobalContextType,
);
