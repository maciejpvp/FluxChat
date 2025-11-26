import { useState, useRef } from "react";
import { ConnectionData } from "../types";
import {
  generateKey,
  exportKey,
  importKey,
  encryptMessage,
  decryptMessage,
} from "../utils/crypto";
import { compressData, decompressData } from "../utils/common";
import { useStunStore } from "../stores/useStunStore";

export const usePeerConnection = (
  onMessageReceived: (data: string) => void,
  onConnected: () => void,
) => {
  const stunConfig = useStunStore((state) => state.config);
  const [connectionCode, setConnectionCode] = useState<string>("");
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "generating" | "waiting" | "connected"
  >("idle");

  const pc = useRef<RTCPeerConnection | null>(null);
  const dc = useRef<RTCDataChannel | null>(null);
  const encryptionKey = useRef<CryptoKey | null>(null);

  const onMessageReceivedRef = useRef(onMessageReceived);
  const onConnectedRef = useRef(onConnected);

  onMessageReceivedRef.current = onMessageReceived;
  onConnectedRef.current = onConnected;

  const cleanup = () => {
    if (dc.current) dc.current.close();
    if (pc.current) pc.current.close();
    pc.current = null;
    setConnectionStatus("idle");
  };

  const setupDataChannel = (channel: RTCDataChannel) => {
    channel.onopen = () => {
      console.log("Data channel open");
      setConnectionStatus("connected");
      onConnectedRef.current();
    };
    channel.onmessage = async (e) => {
      if (encryptionKey.current) {
        try {
          const decrypted = await decryptMessage(e.data, encryptionKey.current);
          onMessageReceivedRef.current(decrypted);
        } catch (err) {
          console.error("Failed to decrypt message", err);
        }
      }
    };
    dc.current = channel;
  };

  const createConnection = async (
    mode: "HOST" | "SLAVE",
    remoteCode?: string,
  ) => {
    cleanup();
    setConnectionStatus("generating");

    pc.current = new RTCPeerConnection(stunConfig);

    pc.current.onicecandidate = (e) => {
      if (!e.candidate && pc.current?.localDescription) {
        if (mode === "HOST" && encryptionKey.current) {
          exportKey(encryptionKey.current).then((jwk) => {
            const payload: ConnectionData = {
              sdp: pc.current!.localDescription!,
              keyJson: jwk,
            };
            setConnectionCode(compressData(payload));
            setConnectionStatus("waiting");
          });
        } else {
          const payload = { sdp: pc.current.localDescription };
          setConnectionCode(compressData(payload));
          setConnectionStatus("waiting");
        }
      }
    };

    if (mode === "HOST") {
      encryptionKey.current = await generateKey();
      const channel = pc.current.createDataChannel("chat");
      setupDataChannel(channel);
      const offer = await pc.current.createOffer();
      await pc.current.setLocalDescription(offer);
    } else if (mode === "SLAVE" && remoteCode) {
      pc.current.ondatachannel = (e) => setupDataChannel(e.channel);

      try {
        const data: ConnectionData = decompressData(remoteCode);
        if (data.keyJson) {
          encryptionKey.current = await importKey(data.keyJson);
        }
        await pc.current.setRemoteDescription(
          new RTCSessionDescription(data.sdp),
        );
        const answer = await pc.current.createAnswer();
        await pc.current.setLocalDescription(answer);
      } catch (e) {
        alert("Invalid invite code");
        setConnectionStatus("idle");
      }
    }
  };

  const completeConnection = async (answerCode: string) => {
    if (!pc.current) return;
    try {
      const data = decompressData(answerCode);
      await pc.current.setRemoteDescription(
        new RTCSessionDescription(data.sdp),
      );
    } catch (e) {
      alert("Invalid answer code");
    }
  };

  const sendMessage = async (payload: any) => {
    if (dc.current?.readyState === "open" && encryptionKey.current) {
      const raw = JSON.stringify(payload);
      const encrypted = await encryptMessage(raw, encryptionKey.current);
      dc.current.send(encrypted);
    }
  };

  return {
    createConnection,
    completeConnection,
    sendMessage,
    connectionCode,
    connectionStatus,
  };
};
