import React, { useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";
import { Message } from "../../types";
import {
  getMessagePosition,
  shouldShowHeader,
} from "../../utils/MessagesHelpers";

interface MessageListProps {
  messages: Message[];
  typingText?: string | null;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, typingText }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingText]);

  console.log(messagesEndRef.current);

  return (
    <div className="flex-1 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-stone-700 scrollbar-track-transparent flex flex-col">
      <div
        className={`min-h-full flex flex-col p-4 gap-4 justify-end`}
      >
        {messages.length === 0 && (
          <div className="text-center text-stone-500 text-sm absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <p>Encrypted connection established.</p>
            <p>Say hello! 👋</p>
          </div>
        )}
        {messages.map((msg, index) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            showHeader={shouldShowHeader(index, messages)}
            position={getMessagePosition(index, messages)}
          />
        ))}
        {typingText && (
          <ChatMessage
            message={{
              id: "typing-indicator",
              sender: "STRANGER",
              type: "TEXT",
              timestamp: Date.now(),
              content: typingText,
            }}
            showHeader={shouldShowHeader(messages.length, messages)}
            position="last"
            isTyping={true}
          />
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
