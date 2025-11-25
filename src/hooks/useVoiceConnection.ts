import { useState, useRef, useCallback } from "react";
import { VoiceStatus, Message } from "../types";
import { generateId } from "../utils/common";

const STUN_SERVERS = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export const useVoiceConnection = (
  sendMessage: (msg: any) => Promise<void>,
) => {
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>("idle");
  const [remoteAudioStream, setRemoteAudioStream] =
    useState<MediaStream | null>(null);

  const pc = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const localCandidates = useRef<RTCIceCandidateInit[]>([]);

  const stopVoice = useCallback(() => {
    if (localStream.current) {
      localStream.current.getTracks().forEach((t) => t.stop());
      localStream.current = null;
    }
    if (pc.current) {
      pc.current.close();
      pc.current = null;
    }
    setRemoteAudioStream(null);
    setVoiceStatus("idle");
  }, []);

  const sendSignal = useCallback(
    async (type: "offer" | "answer" | "end", sdp?: any, candidates?: any[]) => {
      const msg: Message = {
        id: generateId(),
        sender: "ME",
        type: "VOICE_SIGNAL",
        timestamp: Date.now(),
        voiceSignal: { type, sdp, candidates },
      };
      await sendMessage(msg);
    },
    [sendMessage],
  );

  const waitForIceGatheringComplete = (peer: RTCPeerConnection) => {
    return new Promise<void>((resolve) => {
      if (peer.iceGatheringState === "complete") {
        resolve();
      } else {
        const checkState = () => {
          if (peer.iceGatheringState === "complete") {
            peer.removeEventListener("icegatheringstatechange", checkState);
            resolve();
          }
        };
        peer.addEventListener("icegatheringstatechange", checkState);
        setTimeout(() => {
          peer.removeEventListener("icegatheringstatechange", checkState);
          resolve();
        }, 3000);
      }
    });
  };

  const setupPeerConnection = () => {
    const peer = new RTCPeerConnection(STUN_SERVERS);
    localCandidates.current = [];

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        localCandidates.current.push(event.candidate.toJSON());
      }
    };

    peer.ontrack = (event) => {
      const [remote] = event.streams;
      setRemoteAudioStream(remote);
      setVoiceStatus("connected");
    };

    peer.onconnectionstatechange = () => {
      if (
        peer.connectionState === "disconnected" ||
        peer.connectionState === "failed"
      ) {
        stopVoice();
      }
    };

    pc.current = peer;
    return peer;
  };

  const startVoiceCall = async () => {
    try {
      setVoiceStatus("calling");
      localStream.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      const peer = setupPeerConnection();
      localStream.current
        .getTracks()
        .forEach((track) => peer.addTrack(track, localStream.current!));

      const offer = await peer.createOffer({ offerToReceiveAudio: true });
      await peer.setLocalDescription(offer);

      await waitForIceGatheringComplete(peer);

      await sendSignal("offer", peer.localDescription, localCandidates.current);
    } catch (e) {
      console.error(e);
      stopVoice();
    }
  };

  const handleIncomingOffer = useCallback(
    async (
      offerSdp: RTCSessionDescriptionInit,
      candidates: RTCIceCandidateInit[],
    ) => {
      setVoiceStatus("incoming");
      (window as any).__pendingOffer = { sdp: offerSdp, candidates };
    },
    [],
  );

  const acceptVoiceCall = async () => {
    try {
      const pending = (window as any).__pendingOffer;
      if (!pending) return;

      localStream.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      const peer = setupPeerConnection();
      localStream.current
        .getTracks()
        .forEach((track) => peer.addTrack(track, localStream.current!));

      await peer.setRemoteDescription(new RTCSessionDescription(pending.sdp));

      for (const cand of pending.candidates) {
        await peer.addIceCandidate(new RTCIceCandidate(cand));
      }

      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      await waitForIceGatheringComplete(peer);

      await sendSignal(
        "answer",
        peer.localDescription,
        localCandidates.current,
      );
      setVoiceStatus("connected");
    } catch (e) {
      console.error(e);
      stopVoice();
    }
  };

  const handleIncomingAnswer = useCallback(
    async (
      answerSdp: RTCSessionDescriptionInit,
      candidates: RTCIceCandidateInit[],
    ) => {
      if (!pc.current) return;
      try {
        await pc.current.setRemoteDescription(
          new RTCSessionDescription(answerSdp),
        );
        for (const cand of candidates) {
          await pc.current.addIceCandidate(new RTCIceCandidate(cand));
        }
        setVoiceStatus("connected");
      } catch (e) {
        console.error(e);
      }
    },
    [],
  );

  return {
    voiceStatus,
    startVoiceCall,
    acceptVoiceCall,
    endVoiceCall: () => {
      sendSignal("end");
      stopVoice();
    },
    handleIncomingOffer,
    handleIncomingAnswer,
    handleEndSignal: stopVoice,
    remoteAudioStream,
  };
};
