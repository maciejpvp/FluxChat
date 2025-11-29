import { useRef, useCallback } from 'react';

export const useSoundEffects = () => {
    const notificationAudio = useRef<HTMLAudioElement | null>(null);
    const ringtoneAudio = useRef<HTMLAudioElement | null>(null);
    const callWaitAudio = useRef<HTMLAudioElement | null>(null);

    // Initialize audio elements on first use
    const getNotificationAudio = useCallback(() => {
        if (!notificationAudio.current) {
            notificationAudio.current = new Audio('/notification.mp3');
        }
        return notificationAudio.current;
    }, []);

    const getRingtoneAudio = useCallback(() => {
        if (!ringtoneAudio.current) {
            ringtoneAudio.current = new Audio('/ringtone.mp3');
            ringtoneAudio.current.loop = true;
        }
        return ringtoneAudio.current;
    }, []);

    const getCallWaitAudio = useCallback(() => {
        if (!callWaitAudio.current) {
            callWaitAudio.current = new Audio('/call-wait.mp3');
            callWaitAudio.current.loop = true;
        }
        return callWaitAudio.current;
    }, []);

    const playNotification = useCallback(() => {
        const audio = getNotificationAudio();
        audio.currentTime = 0;
        audio.play().catch((err) => {
            console.warn('Failed to play notification sound:', err);
        });
    }, [getNotificationAudio]);

    const playRingtone = useCallback(() => {
        const audio = getRingtoneAudio();
        audio.currentTime = 0;
        audio.play().catch((err) => {
            console.warn('Failed to play ringtone:', err);
        });
    }, [getRingtoneAudio]);

    const stopRingtone = useCallback(() => {
        const audio = getRingtoneAudio();
        audio.pause();
        audio.currentTime = 0;
    }, [getRingtoneAudio]);

    const playCallWait = useCallback(() => {
        const audio = getCallWaitAudio();
        audio.currentTime = 0;
        audio.play().catch((err) => {
            console.warn('Failed to play call-wait sound:', err);
        });
    }, [getCallWaitAudio]);

    const stopCallWait = useCallback(() => {
        const audio = getCallWaitAudio();
        audio.pause();
        audio.currentTime = 0;
    }, [getCallWaitAudio]);

    return {
        playNotification,
        playRingtone,
        stopRingtone,
        playCallWait,
        stopCallWait,
    };
};
