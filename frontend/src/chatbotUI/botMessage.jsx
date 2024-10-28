import React from "react";
import { Bot } from 'lucide-react';
import Loader from './loader';

export default function BotMessage({ text, isLoading = false, isError = false }) {
  return (
    <div className="flex items-start gap-2 max-w-[80%]">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
        <Bot className="w-5 h-5 text-purple-600" />
      </div>
      <div 
        className={`px-4 py-2 rounded-2xl rounded-tl-none ${
          isError 
            ? 'bg-red-50 text-red-600' 
            : 'bg-gray-100 text-gray-800'
        }`}
      >
        {isLoading ? <Loader /> : text}
      </div>
    </div>
  );
}