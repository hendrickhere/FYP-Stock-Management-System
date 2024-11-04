import React from "react";
import { User } from 'lucide-react';

export default function UserMessage({ text, isMobile }) {
  return (
    <div className="flex flex-col items-end">
      <div className="flex items-end gap-1.5 lg:gap-2 max-w-[85%] lg:max-w-[80%] group">
        <div className="px-3 lg:px-4 py-2 text-sm lg:text-base bg-purple-600 text-white rounded-2xl rounded-tr-none">
          {text}
        </div>
        <div className="flex-shrink-0 w-6 lg:w-8 h-6 lg:h-8 rounded-full bg-purple-100 flex items-center justify-center">
          <User className="w-4 lg:w-5 h-4 lg:h-5 text-purple-600" />
        </div>
      </div>
    </div>
  );
}