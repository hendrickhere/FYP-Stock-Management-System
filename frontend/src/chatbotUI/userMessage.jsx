import React from "react";
import { User } from 'lucide-react';

export default function UserMessage({ text }) {
  return (
    <div className="flex flex-col items-end">
      <div className="flex items-end gap-2 max-w-[80%] group">
        <div className="px-4 py-2 bg-purple-600 text-white rounded-2xl rounded-tr-none">
          {text}
        </div>
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
          <User className="w-5 h-5 text-purple-600" />
        </div>
      </div>
    </div>
  );
}