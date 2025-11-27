import React from "react";
import {
    Mic,
    MicOff,
    Video,
    VideoOff,
    Monitor,
    MonitorOff,
    Headphones,
    VolumeX,
    PhoneIncoming,
    PhoneOff,
} from "lucide-react";
import { VoiceStatus } from "../../types";

interface VoiceCallBarProps {
    voiceStatus: VoiceStatus;
    isMuted: boolean;
    isDeafened: boolean;
    localVideoStream: MediaStream | null;
    localScreenStream: MediaStream | null;
    toggleMute: () => void;
    toggleDeaf: () => void;
    toggleCamera: () => void;
    toggleScreenShare: () => void;
    acceptVoiceCall: () => void;
    endVoiceCall: () => void;
}

export const VoiceCallBar: React.FC<VoiceCallBarProps> = ({
    voiceStatus,
    isMuted,
    isDeafened,
    localVideoStream,
    localScreenStream,
    toggleMute,
    toggleDeaf,
    toggleCamera,
    toggleScreenShare,
    acceptVoiceCall,
    endVoiceCall,
}) => {
    if (voiceStatus === "idle") return null;

    return (
        <div className="bg-stone-800 border-b border-stone-700 p-3 flex items-center justify-between shadow-lg animate-in slide-in-from-top-4">
            <div className="flex items-center gap-3">
                <div className="bg-stone-700 p-2 rounded-full relative">
                    <Mic size={20} className="text-white" />
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                </div>
                <div>
                    <h3 className="font-bold text-white text-sm">Voice Chat</h3>
                    <p className="text-xs text-stone-400 flex items-center gap-1">
                        {voiceStatus === "calling" && "Calling..."}
                        {voiceStatus === "incoming" && "Incoming Call..."}
                        {voiceStatus === "connected" && "Connected"}
                    </p>
                </div>
            </div>
            <div className="flex gap-2">
                {voiceStatus === "connected" && (
                    <>
                        <button
                            onClick={toggleMute}
                            className={`p-2 rounded-full transition ${isMuted
                                ? "bg-red-600 text-white"
                                : "bg-stone-700 text-white hover:bg-stone-600"
                                }`}
                            title={isMuted ? "Unmute" : "Mute"}
                        >
                            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                        </button>
                        <button
                            onClick={toggleDeaf}
                            className={`p-2 rounded-full transition ${isDeafened
                                ? "bg-red-600 text-white"
                                : "bg-stone-700 text-white hover:bg-stone-600"
                                }`}
                            title={isDeafened ? "Undeafen" : "Deafen"}
                        >
                            {isDeafened ? <VolumeX size={20} /> : <Headphones size={20} />}
                        </button>
                        <button
                            onClick={() => toggleCamera()}
                            className={`p-2 rounded-full transition ${localVideoStream
                                ? "bg-white text-stone-900"
                                : "bg-stone-700 text-white hover:bg-stone-600"
                                }`}
                            title="Toggle Camera"
                        >
                            {localVideoStream ? <Video size={20} /> : <VideoOff size={20} />}
                        </button>
                        <button
                            onClick={() => toggleScreenShare()}
                            className={`p-2 rounded-full transition ${localScreenStream
                                ? "bg-white text-stone-900"
                                : "bg-stone-700 text-white hover:bg-stone-600"
                                }`}
                            title="Toggle Screen Share"
                        >
                            {localScreenStream ? (
                                <Monitor size={20} />
                            ) : (
                                <MonitorOff size={20} />
                            )}
                        </button>
                    </>
                )}
                {voiceStatus === "incoming" && (
                    <button
                        onClick={acceptVoiceCall}
                        className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-full transition"
                    >
                        <PhoneIncoming size={20} />
                    </button>
                )}
                <button
                    onClick={endVoiceCall}
                    className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full transition"
                >
                    <PhoneOff size={20} />
                </button>
            </div>
        </div>
    );
};
