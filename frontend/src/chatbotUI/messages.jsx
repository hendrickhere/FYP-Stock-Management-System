import React, { useEffect, useRef } from "react";
import { Bot } from 'lucide-react';
import Loader from './loader';

export default function Messages({ messages, isTyping, isMobile }) {
  const scrollContainerRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      const { scrollHeight, clientHeight } = scrollContainerRef.current;
      scrollContainerRef.current.scrollTop = scrollHeight - clientHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  return (
    <div 
      className="absolute inset-0 overflow-y-auto scroll-smooth" 
      ref={scrollContainerRef}
    >
      <div className="px-2 lg:px-4 py-4 lg:py-6 space-y-3 lg:space-y-4">
        {Array.isArray(messages) && messages.length === 0 && (
          <div className="text-center text-gray-500 py-6 lg:py-8 text-sm lg:text-base">
            Start a conversation by sending a message.
          </div>
        )}
        {Array.isArray(messages) ? messages : []}
        
        {isTyping && (
          <div className="flex items-start gap-2 animate-fade-in">
            <div className="flex-shrink-0 w-6 lg:w-8 h-6 lg:h-8 rounded-full bg-purple-100 flex items-center justify-center">
              <Bot className="w-4 lg:w-5 h-4 lg:h-5 text-purple-400" />
            </div>
            <div className="px-3 lg:px-4 py-2 lg:py-3 bg-gray-100 rounded-2xl rounded-tl-none">
              <Loader color="#9CA3AF" /> {/* Using the loader component */}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}