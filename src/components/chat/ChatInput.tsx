import React, { useRef, useState } from "react";
import { Send, Plus, Phone } from "lucide-react";
import { VoiceStatus } from "../../types";

interface ChatInputProps {
    voiceStatus: VoiceStatus;
    startVoiceCall: () => void;
    onSendText: (text: string) => void;
    onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onTyping: (text: string) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
    voiceStatus,
    startVoiceCall,
    onSendText,
    onFileUpload,
    onTyping,
}) => {
    const [inputText, setInputText] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim()) return;
        onSendText(inputText);
        setInputText("");
        onTyping("");
    };

    return (
        <div className="p-4 border-t border-stone-800/50 backdrop-blur-lg">
            <form
                onSubmit={handleSubmit}
                className="flex gap-2 items-end max-w-4xl mx-auto"
            >
                {voiceStatus === "idle" && (
                    <button
                        type="button"
                        onClick={startVoiceCall}
                        className="p-3 bg-stone-800 hover:bg-green-600 text-stone-300 hover:text-white rounded-xl transition-colors flex-shrink-0"
                        title="Start Voice Chat"
                    >
                        <Phone size={20} />
                    </button>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={onFileUpload}
                />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl transition-colors flex-shrink-0"
                    title="Send File"
                >
                    <Plus size={20} />
                </button>

                <div className="flex-1 relative">
                    <input
                        value={inputText}
                        onChange={(e) => {
                            setInputText(e.target.value);
                            onTyping(e.target.value);
                        }}
                        className="w-full p-3 bg-stone-900 border border-stone-700 rounded-xl focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition-all text-stone-100 placeholder-stone-500"
                        placeholder="Type a message..."
                        autoComplete="off"
                    />
                </div>

                <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="p-3 text-stone-950 rounded-xl bg-sky-500 disabled:opacity-50 transition-all font-bold flex-shrink-0"
                >
                    <Send size={20} />
                </button>
            </form>
        </div>
    );
};
