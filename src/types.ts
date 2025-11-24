export type AppMode = "HOME" | "HOST" | "SLAVE" | "CHAT";

export interface Message {
  id: string;
  sender: "ME" | "STRANGER";
  type: "TEXT" | "FILE_INFO" | "FILE_CHUNK";
  timestamp: number;
  content?: string; // For text
  fileInfo?: {
    // For file info
    id: string;
    name: string;
    size: number;
    mime: string;
  };
  chunk?: {
    // For file chunk
    fileId: string;
    index: number;
    data: string; // Base64 encoded string
  };
}

export interface FileTransfer {
  id: string;
  name: string;
  size: number;
  receivedSize: number;
  chunks: ArrayBuffer[];
  status: "uploading" | "downloading" | "completed";
  blobUrl?: string;
}

export interface ConnectionData {
  sdp: RTCSessionDescriptionInit;
  publicKeyJson: JsonWebKey; // CHANGED: We now share the public key, not the session key
}
