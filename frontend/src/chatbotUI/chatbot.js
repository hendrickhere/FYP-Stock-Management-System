import React, { useState, useEffect } from "react";
import Header from "../header";
import Sidebar from "../sidebar";
import BotMessage from "./botMessage";
import UserMessage from "./userMessage";
import Messages from "./messages";
import Input from "./input";
import ChatbotHeader from "./chatbotHeader";
import { Bot } from 'lucide-react';
import axiosInstance from '../axiosConfig';
import ChatList from "./chatList";

function ChatbotUI() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex flex-col h-screen w-full">
      <Header/>
      <div className="flex flex-row flex-grow">
        {!isMobile && <Sidebar/>} 
        <Chatbot isMobile={isMobile} /> 
      </div>
    </div>
  );
}

function Chatbot({ isMobile }) {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('chatMessages');
    return saved ? JSON.parse(saved) : [];
  });
  const [chats, setChats] = useState(() => {
    const saved = localStorage.getItem('chats');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentChatId, setCurrentChatId] = useState(() => {
    const saved = localStorage.getItem('currentChatId');
    return saved || null;
  });
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    localStorage.setItem('chats', JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    localStorage.setItem('currentChatId', currentChatId);
  }, [currentChatId]);

  const createNewChat = () => {
    const now = new Date();
    const defaultTitle = now.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });

    const newChat = {
      id: `chat-${Date.now()}`,
      title: defaultTitle,
      createdAt: now.toISOString(),
      messages: []
    };
    
  // Keep only the 9 most recent chats before adding the new one
  setChats(prev => {
      const recentChats = prev.slice(0, 9);
      return [newChat, ...recentChats];
    });
    setCurrentChatId(newChat.id);
    setMessages([]);
  };

  const selectChat = (chatId) => {
    setCurrentChatId(chatId);
    const chat = chats.find(c => c.id === chatId);
    setMessages(chat?.messages || []);
  };

  const editChatTitle = (chatId, newTitle) => {
    setChats(prev => prev.map(chat => 
      chat.id === chatId
        ? { ...chat, title: newTitle }
        : chat
    ));
  };

  const deleteChat = (chatId) => {
    setChats(prev => {
      const updatedChats = prev.filter(chat => chat.id !== chatId);
      if (currentChatId === chatId && updatedChats.length > 0) {
        // Select the next most recent chat
        setCurrentChatId(updatedChats[0].id);
        setMessages(updatedChats[0].messages || []);
      } else if (updatedChats.length === 0) {
        // If no chats remain, create a new one
        createNewChat();
      }
      return updatedChats;
    });
  };

  // Function to check bot status and authentication
  const checkBotStatus = async () => {
    try {
      // Check if we have an access token
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setAuthError(true);
        setIsOnline(false);
        return;
      }

      await axiosInstance.post("/chatbot/chat", {
        message: "ping"
      });
      setIsOnline(true);
      setAuthError(false);
    } catch (error) {
      console.error('Connection error:', error);
      if (error.response?.status === 401) {
        setAuthError(true);
      }
      setIsOnline(false);
    }
  };

  const send = async (text) => {
    if (!text.trim()) return;
    if (!currentChatId) {
      createNewChat();
    }

    // Check for authentication
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setAuthError(true);
      setIsOnline(false);
      return;
    }

    setMessages(prev => [...prev, {
      type: 'user',
      text: text,
      timestamp: new Date().toISOString()
    }]);
    
    setIsTyping(true);
    setChats(prev => prev.map(chat => {
      if (chat.id === currentChatId) {
        return {
          ...chat,
          messages: [...messages, {
            type: 'user',
            text,
            timestamp: new Date().toISOString()
          }]
        };
      }
      return chat;
    }));

    try {
      const response = await axiosInstance.post("/chatbot/chat", {
        message: text
      });
      
      setIsOnline(true);
      setAuthError(false);
      
      // Add response validation
      if (!response.data || !response.data.message) {
        throw new Error('Invalid response format');
      }
      
      setMessages(prev => [...prev, {
        type: 'bot',
        text: response.data.message,
        timestamp: new Date().toISOString(),
        isError: false
      }]);

    } catch (error) {
      console.error('Error sending message:', error);
      setIsOnline(false);
      
      // Add error message
      setMessages(prev => [...prev, {
        type: 'bot',
        text: error.response?.status === 429 
          ? "Too many requests, please wait a moment..."
          : "Sorry, I'm currently offline and can't respond to messages. Please try again later.",
        isError: true,
        timestamp: new Date().toISOString()
      }]);
    }
    finally {
    setIsTyping(false);
  }
};

  // Save messages to localStorage when they change
  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(messages));
  }, [messages]);
  
  // Check status on mount and periodically
  useEffect(() => {
    checkBotStatus();
    const interval = setInterval(checkBotStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Render message components from data
  const renderMessages = () => {
    return messages.map((message, index) => {
      if (message.type === 'user') {
        return <UserMessage key={index} text={message.text} />;
      } else {
        return <BotMessage 
          key={index} 
          text={message.text} 
          isError={message.isError} 
        />;
      }
    });
  };

  // Create message components array
  const messageComponents = messages.map((msg, index) => {
    if (msg.type === 'user') {
      return <UserMessage key={`msg-${index}`} text={msg.text} />;
    } else {
      return <BotMessage 
        key={`msg-${index}`} 
        text={msg.text} 
        isError={msg.isError} 
      />;
    }
  });

  return (
    <div className={`
      flex-1 flex flex-col h-full bg-gray-50 custom-scrollbar
      transition-all duration-300 ease-in-out
      ${isMobile ? 'w-full' : 'ml-[13rem]'}
    `}>
      <div className="flex flex-col h-full custom-scrollbar">
        {/* Fixed Header */}
        <div className="flex-none">
          <ChatbotHeader 
            isOnline={isOnline} 
            onNewChat={createNewChat}
            currentChatId={currentChatId}
            chats={chats}
            onSelectChat={selectChat}
            onDeleteChat={deleteChat}
            onEditChatTitle={editChatTitle}
            isMobile={isMobile}
          />
          {/* Status messages */}
          <div className="space-y-1">
            {authError && (
              <div className="bg-yellow-50 px-2 lg:px-4 py-2 text-yellow-700 text-xs lg:text-sm text-center">
                Please log in to use the chat feature.
              </div>
            )}
            {!isOnline && !authError && (
              <div className="bg-red-50 px-2 lg:px-4 py-2 text-red-600 text-xs lg:text-sm text-center">
                Connection lost. Attempting to reconnect...
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Messages */}
        <div className="flex-1 overflow-hidden relative">
          <Messages 
            messages={messageComponents} 
            isTyping={isTyping}
            isMobile={isMobile}
          />
        </div>

        {/* Fixed Input */}
        <div className="flex-none bg-white border-t">
          <Input onSend={send} disabled={!isOnline || authError} isMobile={isMobile} />
        </div>
      </div>
    </div>
  );
}

export default ChatbotUI;
