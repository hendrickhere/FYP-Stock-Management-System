import React from "react";
import { Bot, AlertCircle } from 'lucide-react';
import Loader from './loader';

export default function BotMessage({ text, isError, isMobile }) {
  return (
    <div className="flex items-start gap-1.5 lg:gap-2 max-w-[85%] lg:max-w-[80%]">
      <div className="flex-shrink-0 w-6 lg:w-8 h-6 lg:h-8 rounded-full bg-purple-100 flex items-center justify-center">
        <Bot className="w-4 lg:w-5 h-4 lg:h-5 text-purple-600" />
      </div>
      <div className={`px-3 lg:px-4 py-2 text-sm lg:text-base rounded-2xl rounded-tl-none ${
        isError 
          ? 'bg-red-50 text-red-600' 
          : 'bg-gray-100 text-gray-800'
      }`}>
        {text}
      </div>
    </div>
  );
}