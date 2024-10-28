import React from "react";
import { Bot } from 'lucide-react';

export default function ChatbotHeader({ isOnline }) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
          <Bot className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h2 className="font-semibold text-lg text-gray-800">Stocksavvy Assistant</h2>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'} ${isOnline ? 'animate-pulse' : ''}`}></span>
            <span className="text-sm text-gray-500">{isOnline ? 'Online' : 'Offline'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}