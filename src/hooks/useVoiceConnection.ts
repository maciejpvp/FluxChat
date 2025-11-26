import { useState, useRef, useCallback } from "react";
import { VoiceStatus, Message } from "../types";
import { generateId } from "../utils/common";

const STUN_SERVERS = {
  iceServers: [{ urls: "stun:relay1.expressturn.com:3480" },
  {
    urls: "turn:relay1.expressturn.com:3480?transport=tcp",
    username: "000000002079469016",
    credential: "tfkqDXh0R7OgxGs3h9V6HcJ4mjo=",
  },
  ],
};

export const useVoiceConnection = (
  sendMessage: (msg: any) => Promise<void>,
) => {
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>("idle");
  const [remoteAudioStream, setRemoteAudioStream] =
    useState<MediaStream | null>(null);
  const [localVideoStream, setLocalVideoStream] = useState<MediaStream | null>(
    null,
  );
  const [remoteVideoStream, setRemoteVideoStream] =
    useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);

  const audioPc = useRef<RTCPeerConnection | null>(null);
  const videoPc = useRef<RTCPeerConnection | null>(null);

  const localStream = useRef<MediaStream | null>(null);
  const localVideo = useRef<MediaStream | null>(null);

  const audioCandidates = useRef<RTCIceCandidateInit[]>([]);
  const videoCandidates = useRef<RTCIceCandidateInit[]>([]);

  const stopVoice = useCallback(() => {
    if (localStream.current) {
      localStream.current.getTracks().forEach((t) => t.stop());
      localStream.current = null;
    }
    if (localVideo.current) {
      localVideo.current.getTracks().forEach((t) => t.stop());
      localVideo.current = null;
    }
    if (audioPc.current) {
      audioPc.current.close();
      audioPc.current = null;
    }
    if (videoPc.current) {
      videoPc.current.close();
      videoPc.current = null;
    }
    setRemoteAudioStream(null);
    setRemoteVideoStream(null);
    setLocalVideoStream(null);
    setVoiceStatus("idle");
    setIsMuted(false);
    setIsDeafened(false);
  }, []);

  const sendSignal = useCallback(
    async (
      scope: "AUDIO" | "VIDEO",
      type: "offer" | "answer" | "end",
      sdp?: any,
      candidates?: any[],
    ) => {
      const msg: Message = {
        id: generateId(),
        sender: "ME",
        type: "VOICE_SIGNAL",
        timestamp: Date.now(),
        voiceSignal: { scope, type, sdp, candidates },
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

  const setupPeerConnection = (
    scope: "AUDIO" | "VIDEO",
    onTrack: (streams: readonly MediaStream[]) => void,
  ) => {
    const peer = new RTCPeerConnection(STUN_SERVERS);
    const candidatesRef = scope === "AUDIO" ? audioCandidates : videoCandidates;
    candidatesRef.current = [];

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        candidatesRef.current.push(event.candidate.toJSON());
      }
    };

    peer.ontrack = (event) => {
      onTrack(event.streams);
    };

    peer.onconnectionstatechange = () => {
      if (
        peer.connectionState === "disconnected" ||
        peer.connectionState === "failed"
      ) {
        if (scope === "AUDIO") stopVoice();
      }
    };

    if (scope === "AUDIO") audioPc.current = peer;
    else videoPc.current = peer;

    return peer;
  };

  const toggleMute = useCallback(() => {
    if (localStream.current) {
      const enabled = isMuted;
      localStream.current.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const toggleDeaf = useCallback(() => {
    setIsDeafened(prev => !prev);
  }, []);

  const toggleCamera = async () => {
    if (localVideo.current) {
      // Stop camera
      localVideo.current.getTracks().forEach((t) => t.stop());
      localVideo.current = null;
      setLocalVideoStream(null);

      if (videoPc.current) {
        videoPc.current.close();
        videoPc.current = null;
        await sendSignal("VIDEO", "end");
      }
    } else {
      // Start camera
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        localVideo.current = stream;
        setLocalVideoStream(stream);

        const peer = setupPeerConnection("VIDEO", (streams) => {
          setRemoteVideoStream(streams[0]);
        });

        stream.getTracks().forEach(track => peer.addTrack(track, stream));

        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        await waitForIceGatheringComplete(peer);
        await sendSignal("VIDEO", "offer", peer.localDescription, videoCandidates.current);

      } catch (e) {
        console.error("Failed to access camera", e);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (localVideo.current) {
      // Stop screen share
      localVideo.current.getTracks().forEach((t) => t.stop());
      localVideo.current = null;
      setLocalVideoStream(null);

      if (videoPc.current) {
        videoPc.current.close();
        videoPc.current = null;
        await sendSignal("VIDEO", "end");
      }
    } else {
      // Start screen share
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        localVideo.current = stream;
        setLocalVideoStream(stream);

        // Handle user stopping screen share via browser UI
        stream.getVideoTracks()[0].onended = () => {
          if (localVideo.current === stream) {
            toggleScreenShare();
          }
        };

        const peer = setupPeerConnection("VIDEO", (streams) => {
          setRemoteVideoStream(streams[0]);
        });

        stream.getTracks().forEach(track => peer.addTrack(track, stream));

        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        await waitForIceGatheringComplete(peer);
        await sendSignal("VIDEO", "offer", peer.localDescription, videoCandidates.current);

      } catch (e) {
        console.error("Failed to access screen share", e);
      }
    }
  };

  const startVoiceCall = async () => {
    try {
      setVoiceStatus("calling");
      localStream.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      if (isMuted) {
        localStream.current.getAudioTracks().forEach(t => t.enabled = false);
      }

      const peer = setupPeerConnection("AUDIO", (streams) => {
        setRemoteAudioStream(streams[0]);
        setVoiceStatus("connected");
      });

      localStream.current
        .getTracks()
        .forEach((track) => peer.addTrack(track, localStream.current!));

      const offer = await peer.createOffer({ offerToReceiveAudio: true });
      await peer.setLocalDescription(offer);

      await waitForIceGatheringComplete(peer);

      await sendSignal("AUDIO", "offer", peer.localDescription, audioCandidates.current);
    } catch (e) {
      console.error(e);
      stopVoice();
    }
  };

  const handleIncomingOffer = useCallback(
    async (
      scope: "AUDIO" | "VIDEO",
      offerSdp: RTCSessionDescriptionInit,
      candidates: RTCIceCandidateInit[],
    ) => {
      if (scope === "AUDIO") {
        setVoiceStatus("incoming");
        (window as any).__pendingAudioOffer = { sdp: offerSdp, candidates };
      } else {
        // Auto-accept video offers if we are in a call
        if (voiceStatus === "connected" || voiceStatus === "calling") {
          try {
            const peer = setupPeerConnection("VIDEO", (streams) => {
              setRemoteVideoStream(streams[0]);
            });
            await peer.setRemoteDescription(new RTCSessionDescription(offerSdp));
            for (const cand of candidates) {
              await peer.addIceCandidate(new RTCIceCandidate(cand));
            }
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            await waitForIceGatheringComplete(peer);
            await sendSignal("VIDEO", "answer", peer.localDescription, videoCandidates.current);
          } catch (e) {
            console.error("Failed to accept video offer", e);
          }
        }
      }
    },
    [voiceStatus, sendSignal],
  );

  const acceptVoiceCall = async () => {
    try {
      const pending = (window as any).__pendingAudioOffer;
      if (!pending) return;

      localStream.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      // Apply initial mute state
      if (isMuted) {
        localStream.current.getAudioTracks().forEach(t => t.enabled = false);
      }

      const peer = setupPeerConnection("AUDIO", (streams) => {
        setRemoteAudioStream(streams[0]);
        setVoiceStatus("connected");
      });

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
        "AUDIO",
        "answer",
        peer.localDescription,
        audioCandidates.current,
      );
      setVoiceStatus("connected");
    } catch (e) {
      console.error(e);
      stopVoice();
    }
  };

  const handleIncomingAnswer = useCallback(
    async (
      scope: "AUDIO" | "VIDEO",
      answerSdp: RTCSessionDescriptionInit,
      candidates: RTCIceCandidateInit[],
    ) => {
      const peer = scope === "AUDIO" ? audioPc.current : videoPc.current;
      if (!peer) {
        return;
      }
      try {
        await peer.setRemoteDescription(
          new RTCSessionDescription(answerSdp),
        );
        for (const cand of candidates) {
          await peer.addIceCandidate(new RTCIceCandidate(cand));
        }
        if (scope === "AUDIO") setVoiceStatus("connected");
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
      sendSignal("AUDIO", "end");
      stopVoice();
    },
    handleIncomingOffer,
    handleIncomingAnswer,
    handleEndSignal: (scope: "AUDIO" | "VIDEO") => {
      if (scope === "AUDIO") stopVoice();
      else {
        if (videoPc.current) {
          videoPc.current.close();
          videoPc.current = null;
        }
        setRemoteVideoStream(null);
      }
    },
    remoteAudioStream,
    localVideoStream,
    remoteVideoStream,
    toggleCamera,
    toggleScreenShare,
    isMuted,
    isDeafened,
    toggleMute,
    toggleDeaf,
  };
};

