import { useState, useRef, useCallback } from "react";
import { VoiceStatus, Message } from "../types";
import { generateId } from "../utils/common";
import { useStunStore } from "../stores/useStunStore";


export const useVoiceConnection = (
  sendMessage: (msg: any) => Promise<void>,
) => {
  const stunConfig = useStunStore((state) => state.config);
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>("idle");
  const [remoteAudioStream, setRemoteAudioStream] =
    useState<MediaStream | null>(null);
  const [localVideoStream, setLocalVideoStream] = useState<MediaStream | null>(
    null,
  );
  const [remoteVideoStream, setRemoteVideoStream] =
    useState<MediaStream | null>(null);
  const [localScreenStream, setLocalScreenStream] = useState<MediaStream | null>(
    null,
  );
  const [remoteScreenStream, setRemoteScreenStream] =
    useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);

  const audioPc = useRef<RTCPeerConnection | null>(null);
  const videoPc = useRef<RTCPeerConnection | null>(null);
  const screenPc = useRef<RTCPeerConnection | null>(null);

  const localStream = useRef<MediaStream | null>(null);
  const localVideo = useRef<MediaStream | null>(null);
  const localScreen = useRef<MediaStream | null>(null);

  const audioCandidates = useRef<RTCIceCandidateInit[]>([]);
  const videoCandidates = useRef<RTCIceCandidateInit[]>([]);
  const screenCandidates = useRef<RTCIceCandidateInit[]>([]);

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
    if (screenPc.current) {
      screenPc.current.close();
      screenPc.current = null;
    }
    if (localScreen.current) {
      localScreen.current.getTracks().forEach((t) => t.stop());
      localScreen.current = null;
    }
    setRemoteAudioStream(null);
    setRemoteVideoStream(null);
    setLocalVideoStream(null);
    setRemoteScreenStream(null);
    setLocalScreenStream(null);
    setVoiceStatus("idle");
    setIsMuted(false);
    setIsDeafened(false);
  }, []);

  const sendSignal = useCallback(
    async (
      scope: "AUDIO" | "VIDEO" | "SCREEN",
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
    scope: "AUDIO" | "VIDEO" | "SCREEN",
    onTrack: (streams: readonly MediaStream[]) => void,
  ) => {
    const peer = new RTCPeerConnection(stunConfig);
    let candidatesRef;
    if (scope === "AUDIO") candidatesRef = audioCandidates;
    else if (scope === "VIDEO") candidatesRef = videoCandidates;
    else candidatesRef = screenCandidates;
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
    else if (scope === "VIDEO") videoPc.current = peer;
    else screenPc.current = peer;

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
    if (localScreen.current) {
      // Stop screen share
      localScreen.current.getTracks().forEach((t) => t.stop());
      localScreen.current = null;
      setLocalScreenStream(null);

      if (screenPc.current) {
        screenPc.current.close();
        screenPc.current = null;
        await sendSignal("SCREEN", "end");
      }
    } else {
      // Start screen share
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        localScreen.current = stream;
        setLocalScreenStream(stream);

        // Handle user stopping screen share via browser UI
        stream.getVideoTracks()[0].onended = () => {
          if (localScreen.current === stream) {
            toggleScreenShare();
          }
        };

        const peer = setupPeerConnection("SCREEN", (streams) => {
          setRemoteScreenStream(streams[0]);
        });

        stream.getTracks().forEach(track => peer.addTrack(track, stream));

        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        await waitForIceGatheringComplete(peer);
        await sendSignal("SCREEN", "offer", peer.localDescription, screenCandidates.current);

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
      scope: "AUDIO" | "VIDEO" | "SCREEN",
      offerSdp: RTCSessionDescriptionInit,
      candidates: RTCIceCandidateInit[],
    ) => {
      if (scope === "AUDIO") {
        setVoiceStatus("incoming");
        (window as any).__pendingAudioOffer = { sdp: offerSdp, candidates };
      } else {
        // Auto-accept video/screen offers if we are in a call
        if (voiceStatus === "connected" || voiceStatus === "calling") {
          try {
            const peer = setupPeerConnection(scope, (streams) => {
              if (scope === "VIDEO") setRemoteVideoStream(streams[0]);
              else setRemoteScreenStream(streams[0]);
            });
            await peer.setRemoteDescription(new RTCSessionDescription(offerSdp));
            for (const cand of candidates) {
              await peer.addIceCandidate(new RTCIceCandidate(cand));
            }
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            await waitForIceGatheringComplete(peer);
            await sendSignal(scope, "answer", peer.localDescription, scope === "VIDEO" ? videoCandidates.current : screenCandidates.current);
          } catch (e) {
            console.error(`Failed to accept ${scope} offer`, e);
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
      scope: "AUDIO" | "VIDEO" | "SCREEN",
      answerSdp: RTCSessionDescriptionInit,
      candidates: RTCIceCandidateInit[],
    ) => {
      let peer;
      if (scope === "AUDIO") peer = audioPc.current;
      else if (scope === "VIDEO") peer = videoPc.current;
      else peer = screenPc.current;

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
    handleEndSignal: (scope: "AUDIO" | "VIDEO" | "SCREEN") => {
      if (scope === "AUDIO") stopVoice();
      else if (scope === "VIDEO") {
        if (videoPc.current) {
          videoPc.current.close();
          videoPc.current = null;
        }
        setRemoteVideoStream(null);
      } else {
        if (screenPc.current) {
          screenPc.current.close();
          screenPc.current = null;
        }
        setRemoteScreenStream(null);
      }
    },
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
  };
};

