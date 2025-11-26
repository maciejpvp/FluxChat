export type AppMode = 'HOME' | 'HOST' | 'SLAVE' | 'CHAT';

export interface Message {
  id: string;
  sender: 'ME' | 'STRANGER';
  type: 'TEXT' | 'FILE_INFO' | 'FILE_CHUNK' | 'VOICE_SIGNAL';
  timestamp: number;
  content?: string;
  fileInfo?: {
    id: string;
    name: string;
    size: number;
    type: string;
  };
  chunk?: {
    fileId: string;
    index: number;
    data: string;
  };
  voiceSignal?: {
    type: 'offer' | 'answer' | 'end';
    scope: 'AUDIO' | 'VIDEO';
    sdp?: RTCSessionDescriptionInit;
    candidates?: RTCIceCandidateInit[];
  };
}

export interface FileTransfer {
  id: string;
  name: string;
  size: number;
  receivedSize: number;
  chunks: ArrayBuffer[];
  status: 'uploading' | 'downloading' | 'completed';
  progress?: number;
  blobUrl?: string;
}

export interface ConnectionData {
  sdp: RTCSessionDescriptionInit;
  keyJson?: JsonWebKey;
}

export type VoiceStatus = 'idle' | 'calling' | 'incoming' | 'connected';
