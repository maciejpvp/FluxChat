import React, { useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";
import { Message } from "../../types";

interface MessageListProps {
    messages: Message[];
}

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-stone-700 scrollbar-track-transparent flex flex-col">
            <div
                className={`min-h-full flex flex-col p-4 gap-4 ${messages.length === 0 ? "justify-center" : "justify-end"
                    }`}
            >
                {messages.length === 0 && (
                    <div className="text-center text-stone-500 text-sm">
                        <p>Encrypted connection established.</p>
                        <p>Say hello! 👋</p>
                    </div>
                )}
                {messages.map((msg) => (
                    <ChatMessage key={msg.id} message={msg} />
                ))}
                <div ref={messagesEndRef} />
            </div>
        </div>
    );
};
