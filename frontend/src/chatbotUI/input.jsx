import React, { useState } from "react";
import { Send, PlusCircle } from 'lucide-react';

export default function Input({ onSend, disabled }) {
  const [text, setText] = useState("");

  const handleInputChange = e => {
    setText(e.target.value);
  };

  const handleSend = e => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSend(text);
    setText("");
  };

  return (
    <div className="px-4 py-3">
      <form onSubmit={handleSend} className="flex items-center gap-2">
        <button
          type="button"
          className={`p-2 transition-colors ${
            disabled ? 'text-gray-300' : 'text-gray-400 hover:text-purple-600'
          }`}
          disabled={disabled}
        >
          <PlusCircle className="w-6 h-6" />
        </button>
        <input
          type="text"
          onChange={handleInputChange}
          value={text}
          disabled={disabled}
          placeholder={disabled ? "Bot is currently offline..." : "Message Stocksavvy Assistant..."}
          className={`flex-1 px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white ${
            disabled ? 'bg-gray-100 text-gray-400' : 'bg-gray-100'
          }`}
        />
        <button 
          type="submit"
          className={`p-2 rounded-full transition-colors ${
            !disabled && text.trim() 
              ? 'text-purple-600 hover:bg-purple-50' 
              : 'text-gray-300'
          }`}
          disabled={disabled || !text.trim()}
        >
          <Send className="w-6 h-6" />
        </button>
      </form>
    </div>
  );
}