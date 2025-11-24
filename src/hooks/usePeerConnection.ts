import { useState, useRef } from "react";
import { ConnectionData } from "../types";
import {
  generateKeyPair,
  exportPublicKey,
  importPublicKey,
  deriveSharedKey,
  encryptMessage,
  decryptMessage,
} from "../utils/crypto";
import { toBase64, fromBase64 } from "../utils/common";

export const usePeerConnection = (
  onMessageReceived: (data: string) => void,
  onConnected: () => void,
) => {
  const [connectionCode, setConnectionCode] = useState<string>("");
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "generating" | "waiting" | "connected"
  >("idle");

  const pc = useRef<RTCPeerConnection | null>(null);
  const dc = useRef<RTCDataChannel | null>(null);

  const localKeyPair = useRef<CryptoKeyPair | null>(null);
  const sharedKey = useRef<CryptoKey | null>(null);

  const cleanup = () => {
    if (dc.current) dc.current.close();
    if (pc.current) pc.current.close();
    pc.current = null;
    localKeyPair.current = null;
    sharedKey.current = null;
    setConnectionStatus("idle");
  };

  const setupDataChannel = (channel: RTCDataChannel) => {
    channel.onopen = () => {
      console.log("Data channel open");
      setConnectionStatus("connected");
      onConnected();
    };
    channel.onmessage = async (e) => {
      if (sharedKey.current) {
        try {
          const decrypted = await decryptMessage(e.data, sharedKey.current);
          onMessageReceived(decrypted);
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

    localKeyPair.current = await generateKeyPair();

    const config: RTCConfiguration = {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    };

    pc.current = new RTCPeerConnection(config);

    pc.current.onicecandidate = async (e) => {
      if (
        !e.candidate &&
        pc.current?.localDescription &&
        localKeyPair.current
      ) {
        const myPublicKeyJwk = await exportPublicKey(
          localKeyPair.current.publicKey,
        );

        const payload: ConnectionData = {
          sdp: pc.current.localDescription,
          publicKeyJson: myPublicKeyJwk,
        };

        setConnectionCode(toBase64(JSON.stringify(payload)));
        setConnectionStatus("waiting");
      }
    };

    if (mode === "HOST") {
      const channel = pc.current.createDataChannel("chat");
      setupDataChannel(channel);

      const offer = await pc.current.createOffer();
      await pc.current.setLocalDescription(offer);
    } else if (mode === "SLAVE" && remoteCode) {
      pc.current.ondatachannel = (e) => setupDataChannel(e.channel);

      try {
        const data: ConnectionData = JSON.parse(fromBase64(remoteCode));

        if (data.publicKeyJson && localKeyPair.current) {
          const hostPublicKey = await importPublicKey(data.publicKeyJson);
          sharedKey.current = await deriveSharedKey(
            localKeyPair.current.privateKey,
            hostPublicKey,
          );
        }

        await pc.current.setRemoteDescription(
          new RTCSessionDescription(data.sdp),
        );
        const answer = await pc.current.createAnswer();
        await pc.current.setLocalDescription(answer);
      } catch (e) {
        console.error("Invalid invite code", e);
        alert("Invalid invite code");
        setConnectionStatus("idle");
      }
    }
  };

  const completeConnection = async (answerCode: string) => {
    if (!pc.current || !localKeyPair.current) return;
    try {
      const data: ConnectionData = JSON.parse(fromBase64(answerCode));

      if (data.publicKeyJson) {
        const slavePublicKey = await importPublicKey(data.publicKeyJson);
        sharedKey.current = await deriveSharedKey(
          localKeyPair.current.privateKey,
          slavePublicKey,
        );
      }

      await pc.current.setRemoteDescription(
        new RTCSessionDescription(data.sdp),
      );
    } catch (e) {
      console.error("Error completing connection", e);
      alert("Invalid answer code");
    }
  };

  const sendMessage = async (payload: any) => {
    if (dc.current?.readyState === "open" && sharedKey.current) {
      const raw = JSON.stringify(payload);
      const encrypted = await encryptMessage(raw, sharedKey.current);
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
