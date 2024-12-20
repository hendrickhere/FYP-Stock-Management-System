import React, { useEffect, useRef } from "react";
import { Bot } from 'lucide-react';
import Loader from './loader';
import BotMessage from './botMessage';  
import UserMessage from './userMessage';

export default function Messages({ 
  messages, 
  isTyping, 
  isMobile,
  automationState,
  onProcessingComplete,
  onProcessingCancel,
  onActionClick 
}) {
  const scrollContainerRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Add data validation and transformation
  const processMessageForBot = (message) => {
    // Ensure message has necessary properties with defaults
    return {
      text: message.text || '',
      data: message.data || null,
      fileAnalysis: message.fileAnalysis || null,
      analysisResult: message.analysisResult || null,
      showPreview: message.showPreview || false,
      actions: message.actions || [],
      isError: message.isError || false,
      timestamp: message.timestamp
    };
  };

  // Scroll logic remains the same
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
      className={`absolute inset-0 overflow-y-auto overflow-x-hidden scroll-smooth custom-scrollbar
        ${isMobile ? 'px-2 pb-20 pt-4' : 'px-4 pb-4 pt-6'}
      `}
      ref={scrollContainerRef}
    >
      <div className="space-y-4">
        {Array.isArray(messages) && messages.length === 0 && (
          <div className="text-center text-gray-500 py-6 lg:py-8 text-xs lg:text-base">
            Start a conversation by sending a message.
          </div>
        )}
        
        {Array.isArray(messages) && messages.map((message, index) => {
          const key = message.timestamp || `message-${index}`;
          
          // Process bot messages
          if (message.type === 'bot') {
            const processedMessage = processMessageForBot(message);
            console.log('Processed bot message:', processedMessage); // For debugging

            return (
              <div key={key} className="animate-fade-in">
                <BotMessage
                  key={index}
                  text={message.text}
                  fileAnalysis={message.fileAnalysis}    
                  analysisResult={message.analysisResult} 
                  showPreview={message.showPreview}
                  actions={message.actions}
                  isError={message.isError}
                  onProcessingComplete={onProcessingComplete}
                  onProcessingCancel={onProcessingCancel}
                />
              </div>
            );
          }

          return (
            <div 
              key={key} 
              className="flex justify-end animate-fade-in"
            >
              <UserMessage 
                {...message}
                isMobile={isMobile}
              />
            </div>
          );
        })}
        
        {isTyping && (
          <div className="flex items-start gap-2 animate-fade-in">
            <div className="flex-shrink-0 w-6 lg:w-8 h-6 lg:h-8 rounded-full bg-purple-100 flex items-center justify-center">
              <Bot className="w-4 lg:w-5 h-4 lg:h-5 text-purple-400" />
            </div>
            <div className="px-3 lg:px-4 py-2 lg:py-3 bg-gray-100 rounded-2xl rounded-tl-none">
              <Loader color="#9CA3AF" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}