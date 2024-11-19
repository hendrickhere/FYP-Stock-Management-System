import React, { useState, useEffect, useRef } from "react";
import Header from "../header";
import Sidebar from "../sidebar";
import BotMessage from "./botMessage";
import UserMessage from "./userMessage";
import Messages from "./messages";
import Input from "./input";
import ChatbotHeader from "./chatbotHeader";
import ChatLoader from './chatLoader';
import ChatErrorBoundary from "./chatErrorBoundary";
import axiosInstance from '../axiosConfig';
import { Alert } from "../ui/alert";

const CONNECTION_CHECK_INTERVAL = 30000;
const SESSION_MESSAGES_KEY = 'stocksavvy_current_messages';

function ChatbotUI() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex flex-col h-screen w-full">
      <Header/>
      <div className="flex flex-row flex-grow">
        {!isMobile && <Sidebar/>}
        <ChatErrorBoundary>
          <Chatbot isMobile={isMobile} />
        </ChatErrorBoundary>
      </div>
    </div>
  );
}

function Chatbot({ isMobile }) {
  const [messages, setMessages] = useState(() => {
    try {
      const savedMessages = sessionStorage.getItem(SESSION_MESSAGES_KEY);
      return savedMessages ? JSON.parse(savedMessages) : [];
    } catch (error) {
      console.error('Error loading messages:', error);
      return [];
    }
  });

  const [status, setStatus] = useState({
    isTyping: false,
    isOnline: true,
    authError: false,
    retryCount: 0,
    isRetrying: false,
    isProcessingFile: false
  });

  const messageEndRef = useRef(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_MESSAGES_KEY, JSON.stringify(messages));
    } catch (error) {
      console.error('Error saving messages:', error);
    }
  }, [messages]);

  const handleFileUpload = async (file) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setStatus(prev => ({ ...prev, authError: true, isOnline: false }));
      return;
    }

    setStatus(prev => ({ ...prev, isProcessingFile: true }));

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Add file message to chat
      setMessages(prev => [...prev, {
        type: 'user',
        text: `Uploaded file: ${file.name}`,
        timestamp: new Date().toISOString()
      }]);

      const response = await axiosInstance.post("/chatbot/process-file", formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setMessages(prev => [...prev, {
        type: 'bot',
        text: response.data.message,
        data: response.data.data,
        timestamp: new Date().toISOString()
      }]);

    } catch (error) {
      console.error('File processing error:', error);
      setMessages(prev => [...prev, {
        type: 'bot',
        text: 'Sorry, I encountered an error processing your file. Please try again.',
        isError: true,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setStatus(prev => ({ ...prev, isProcessingFile: false }));
    }
  };

  const send = async (text) => {
    if (!text.trim()) return;

    const token = localStorage.getItem('accessToken');
    if (!token) {
      setStatus(prev => ({ ...prev, authError: true, isOnline: false }));
      return;
    }

    setMessages(prev => [...prev, {
      type: 'user',
      text: text,
      timestamp: new Date().toISOString()
    }]);

    setStatus(prev => ({ ...prev, isTyping: true }));

    try {
      const response = await axiosInstance.post("/chatbot/chat", { message: text });
      
      setMessages(prev => [...prev, {
        type: 'bot',
        text: response.data.message,
        data: response.data.data,
        timestamp: new Date().toISOString()
      }]);
      
      setStatus(prev => ({
        ...prev,
        isOnline: true,
        authError: false,
        retryCount: 0
      }));

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        type: 'bot',
        text: 'Sorry, I encountered an error. Please try again.',
        isError: true,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setStatus(prev => ({ ...prev, isTyping: false }));
    }
  };

  return (
    <div className={`
      flex-1 flex flex-col h-full bg-gray-50 custom-scrollbar
      transition-all duration-300 ease-in-out
      ${isMobile ? 'w-full' : 'ml-[13rem]'}
    `}>
      <div className="flex flex-col h-full relative">
        <ChatbotHeader 
          isOnline={status.isOnline}
          isMobile={isMobile}
        />

        {(status.authError || !status.isOnline) && (
          <Alert variant="warning" className="mx-4 my-2">
            {status.authError 
              ? "Please log in to use the chat feature."
              : "Connection lost. Attempting to reconnect..."}
          </Alert>
        )}

        <div className="flex-1 relative"> 
          <Messages 
            messages={messages} 
            isTyping={status.isTyping || status.isProcessingFile}
            isMobile={isMobile}
          />
          <div ref={messageEndRef} />
        </div>

        <div className="flex-none bg-white border-t">
          <Input 
            onSend={send} 
            onFileUpload={handleFileUpload}
            disabled={!status.isOnline || status.authError || status.isRetrying}
            isMobile={isMobile}
          />
        </div>
      </div>
    </div>
  );
}

export default ChatbotUI;