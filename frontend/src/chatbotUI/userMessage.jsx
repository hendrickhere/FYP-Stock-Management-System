import React from "react";
import { User } from 'lucide-react';

export default function UserMessage({ text, timestamp, isMobile }) {  
  return (
    <div className="flex flex-row-reverse items-end gap-1.5 lg:gap-2 max-w-[85%] lg:max-w-[80%] ml-auto">
      <div className="flex-shrink-0 w-8 lg:w-8 h-8 lg:h-8 rounded-full bg-purple-100 flex items-center justify-center">
        <User className="w-5 lg:w-5 h-5 lg:h-5 text-purple-600" />
      </div>
      
      <div className="px-3 lg:px-4 py-2 text-sm bg-purple-600 text-white rounded-2xl rounded-tr-none break-words">
        {text}
      </div>
    </div>
  );
}