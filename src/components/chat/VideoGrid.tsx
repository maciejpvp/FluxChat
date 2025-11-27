import React, { useEffect, useRef } from "react";

interface VideoGridProps {
    localVideoStream: MediaStream | null;
    remoteVideoStream: MediaStream | null;
    localScreenStream: MediaStream | null;
    remoteScreenStream: MediaStream | null;
}

export const VideoGrid: React.FC<VideoGridProps> = ({
    localVideoStream,
    remoteVideoStream,
    localScreenStream,
    remoteScreenStream,
}) => {
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const localScreenRef = useRef<HTMLVideoElement>(null);
    const remoteScreenRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (localVideoStream && localVideoRef.current) {
            localVideoRef.current.srcObject = localVideoStream;
            localVideoRef.current.play().catch(console.error);
        }
    }, [localVideoStream]);

    useEffect(() => {
        if (remoteVideoStream && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteVideoStream;
            remoteVideoRef.current.play().catch(console.error);
        }
    }, [remoteVideoStream]);

    useEffect(() => {
        if (localScreenStream && localScreenRef.current) {
            localScreenRef.current.srcObject = localScreenStream;
            localScreenRef.current.play().catch(console.error);
        }
    }, [localScreenStream]);

    useEffect(() => {
        if (remoteScreenStream && remoteScreenRef.current) {
            remoteScreenRef.current.srcObject = remoteScreenStream;
            remoteScreenRef.current.play().catch(console.error);
        }
    }, [remoteScreenStream]);

    if (
        !localVideoStream &&
        !remoteVideoStream &&
        !localScreenStream &&
        !remoteScreenStream
    ) {
        return null;
    }

    return (
        <div className="p-4 grid grid-cols-2 gap-4">
            {localVideoStream && (
                <div className="relative rounded-xl overflow-hidden bg-black aspect-video shadow-lg border border-stone-700">
                    <video
                        ref={localVideoRef}
                        muted
                        className="w-full h-full object-cover"
                        autoPlay
                        playsInline
                    />
                    <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-xs text-white">
                        You (Camera)
                    </div>
                </div>
            )}
            {remoteVideoStream && (
                <div className="relative rounded-xl overflow-hidden bg-black aspect-video shadow-lg border border-stone-700">
                    <video
                        ref={remoteVideoRef}
                        className="w-full h-full object-cover"
                        autoPlay
                        playsInline
                    />
                    <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-xs text-white">
                        Remote (Camera)
                    </div>
                </div>
            )}
            {localScreenStream && (
                <div className="relative rounded-xl overflow-hidden bg-black aspect-video shadow-lg border border-stone-700">
                    <video
                        ref={localScreenRef}
                        muted
                        className="w-full h-full object-cover"
                        autoPlay
                        playsInline
                    />
                    <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-xs text-white">
                        You (Screen)
                    </div>
                </div>
            )}
            {remoteScreenStream && (
                <div className="relative rounded-xl overflow-hidden bg-black aspect-video shadow-lg border border-stone-700">
                    <video
                        ref={remoteScreenRef}
                        className="w-full h-full object-cover"
                        autoPlay
                        playsInline
                    />
                    <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-xs text-white">
                        Remote (Screen)
                    </div>
                </div>
            )}
        </div>
    );
};
