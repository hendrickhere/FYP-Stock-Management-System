import React from "react";
import { Bot } from 'lucide-react';

export default function ChatbotHeader({ isOnline, isMobile }) {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className={`
        flex items-center
        px-3 lg:px-4 py-1.5 lg:py-2
        transition-all duration-300 ease-in-out
      `}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center">
            <Bot className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <h2 className="font-semibold text-sm lg:text-base text-gray-800">
              {isMobile ? 'Assistant' : 'Stocksavvy Assistant'}
            </h2>
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'} ${isOnline ? 'animate-pulse' : ''}`}></span>
              <span className="text-xs text-gray-500">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}