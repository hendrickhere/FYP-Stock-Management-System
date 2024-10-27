import React, { useState, useEffect } from "react";
import Header from "../header";
import Sidebar from "../sidebar";

import BotMessage from "./botMessage";
import UserMessage from "./userMessage";
import Messages from "./messages";
import Input from "./input";

import ChatbotHeader from "./chatbotHeader";
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

  useEffect(() => {
    async function loadWelcomeMessage() {
      const response = await axios.post("http://localhost:3002/api/chatbot/chat", {
        message: "hi"
      });
      setMessages([<BotMessage key="0" text={response.data.message} />]);
    }
    loadWelcomeMessage();
  }, []);

  const send = async (text) => {
    const userMessage = <UserMessage key={messages.length + 1} text={text} />;
    const response = await axios.post("http://localhost:3002/api/chatbot/chat", {
      message: text
    });
    const botMessage = <BotMessage key={messages.length + 2} text={response.data.message} />;
    setMessages([...messages, userMessage, botMessage]);
  };

  return(
    <div className="ml-52 flex flex-auto flex-col w-[500px] overflow-hidden text-center rounded-lg shadow-lg font-mono bg-slate-200">
      <ChatbotHeader />
      <Messages messages={messages} />
      <Input onSend={send} />
    </div>
  );
}

export default ChatbotUI;
