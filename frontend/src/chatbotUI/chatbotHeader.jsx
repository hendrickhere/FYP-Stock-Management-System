import React from "react";
import { Bot } from 'lucide-react';

export default function ChatbotHeader({ isOnline, isMobile }) {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className={`
        flex items-center
        px-3 lg:px-6 py-2 lg:py-3
        transition-all duration-300 ease-in-out
      `}>
        <div className="flex items-center gap-2 lg:gap-3">
          <div className="w-8 lg:w-10 h-8 lg:h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <Bot className="w-5 lg:w-6 h-5 lg:h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="font-semibold text-base lg:text-lg text-gray-800">
              {isMobile ? 'Assistant' : 'Stocksavvy Assistant'}
            </h2>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'} ${isOnline ? 'animate-pulse' : ''}`}></span>
              <span className="text-xs lg:text-sm text-gray-500">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}