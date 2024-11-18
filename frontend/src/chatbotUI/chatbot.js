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
  // Initialize messages from sessionStorage if available
  const [messages, setMessages] = useState(() => {
    try {
      const savedMessages = sessionStorage.getItem(SESSION_MESSAGES_KEY);
      return savedMessages ? JSON.parse(savedMessages) : [];
    } catch (error) {
      console.error('Error loading messages from session:', error);
      return [];
    }
  });

  const [status, setStatus] = useState({
    isTyping: false,
    isOnline: true,
    authError: false,
    retryCount: 0,
    isRetrying: false
  });

  const messageEndRef = useRef(null);

  // Save messages to sessionStorage whenever they change
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_MESSAGES_KEY, JSON.stringify(messages));
    } catch (error) {
      console.error('Error saving messages to session:', error);
    }
  }, [messages]);

  // Clear messages when user logs out
  useEffect(() => {
    const handleLogout = () => {
      sessionStorage.removeItem(SESSION_MESSAGES_KEY);
      setMessages([]);
    };

    // Listen for storage events to sync across tabs
    const handleStorageChange = (e) => {
      if (e.key === 'accessToken' && !e.newValue) {
        handleLogout();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Bot Status Check
  const checkBotStatus = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setStatus(prev => ({ ...prev, authError: true, isOnline: false }));
        return;
      }

      await axiosInstance.post("/chatbot/chat", { message: "ping" });
      setStatus(prev => ({ ...prev, isOnline: true, authError: false }));
    } catch (error) {
      console.error('Connection error:', error);
      setStatus(prev => ({
        ...prev,
        isOnline: false,
        authError: error.response?.status === 401
      }));
    }
  };

  useEffect(() => {
    checkBotStatus();
    const interval = setInterval(checkBotStatus, CONNECTION_CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const send = async (text) => {
    if (!text.trim()) return;

    const token = localStorage.getItem('accessToken');
    if (!token) {
      setStatus(prev => ({ ...prev, authError: true, isOnline: false }));
      return;
    }

    // Add user message
    setMessages(prev => [...prev, {
      type: 'user',
      text: text,
      timestamp: new Date().toISOString()
    }]);

    setStatus(prev => ({ ...prev, isTyping: true }));

    try {
      const response = await axiosInstance.post("/chatbot/chat", { message: text });
      
      if (!response.data?.message) {
        throw new Error('Invalid response format');
      }

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
          <Alert variant={status.authError ? "warning" : "error"} className="mx-4 my-2">
            {status.authError 
              ? "Please log in to use the chat feature."
              : "Connection lost. Attempting to reconnect..."}
          </Alert>
        )}

        <div className="flex-1 relative"> 
          <Messages 
            messages={messages} 
            isTyping={status.isTyping}
            isMobile={isMobile}
          />
          <div ref={messageEndRef} />
        </div>

        <div className="flex-none bg-white border-t">
          <Input 
            onSend={send} 
            disabled={!status.isOnline || status.authError || status.isRetrying}
            isMobile={isMobile}
          />
        </div>
      </div>
    </div>
  );
}

export default ChatbotUI;