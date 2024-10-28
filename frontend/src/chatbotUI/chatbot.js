import React, { useState, useEffect } from "react";
import Header from "../header";
import Sidebar from "../sidebar";
import BotMessage from "./botMessage";
import UserMessage from "./userMessage";
import Messages from "./messages";
import Input from "./input";
import ChatbotHeader from "./chatbotHeader";
import { Bot } from 'lucide-react';
import axios from "axios";

function ChatbotUI() {
  return (
    <div className="flex flex-col h-screen w-full">
      <Header/>
      <div className="flex flex-row flex-grow">
        <Sidebar/>
        <Chatbot/>
      </div>
    </div>
  );
}

function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(true); // Add this state

  // Function to check bot status
  const checkBotStatus = async () => {
    try {
      await axios.post("http://localhost:3002/api/chatbot/chat", {
        message: "ping"
      });
      setIsOnline(true);
    } catch (error) {
      setIsOnline(false);
    }
  };

  // Check status on mount and periodically
  useEffect(() => {
    checkBotStatus();
    const interval = setInterval(checkBotStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const send = async (text) => {
    if (!text.trim()) return;

    const userMessage = <UserMessage key={messages.length + 1} text={text} />;
    setMessages(prev => [...prev, userMessage]);
    
    setIsTyping(true);
    try {
      const response = await axios.post("http://localhost:3002/api/chatbot/chat", {
        message: text
      });
      setIsOnline(true); // Set online when response is successful
      const botMessage = (
        <BotMessage 
          key={messages.length + 2} 
          text={response.data.message}
        />
      );
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      setIsOnline(false); // Set offline when there's an error
      setMessages(prev => [...prev, 
        <BotMessage 
          key={messages.length + 2} 
          text="Sorry, I'm currently offline and can't respond to messages. Please try again later."
          isError={true}
        />
      ]);
    }
    setIsTyping(false);
  };

  return(
    <div className="flex-1 flex flex-col ml-52 h-full bg-gray-50">
      <div className="flex flex-col h-full">
        <ChatbotHeader isOnline={isOnline} />
        {/* Rest of the component */}
        {!isOnline && (
          <div className="bg-red-50 px-4 py-2 text-red-600 text-sm text-center">
            Connection lost. Attempting to reconnect...
          </div>
        )}
        <div className="flex-1 overflow-hidden">
          <Messages 
            messages={messages} 
            isTyping={isTyping}
          />
        </div>
        <div className="bg-white border-t">
          <Input onSend={send} disabled={!isOnline} />
        </div>
      </div>
    </div>
  );
}

export default ChatbotUI;
