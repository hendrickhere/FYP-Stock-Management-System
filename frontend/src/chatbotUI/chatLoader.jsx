import React from 'react';
import { Bot } from 'lucide-react';

const ChatLoader = ({ type = 'typing' }) => {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
        <Bot className="w-5 h-5 text-purple-600" />
      </div>
      <div className="px-4 py-3 bg-gray-100 rounded-2xl rounded-tl-none">
        {type === 'typing' && (
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-sm text-gray-500">StockSavvy is thinking...</span>
          </div>
        )}
        {type === 'loading' && (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
            <span className="text-sm text-gray-500">Fetching inventory data...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatLoader;