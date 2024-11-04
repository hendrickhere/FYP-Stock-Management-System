import React from 'react';
import { MessageSquare, Clock, Trash2 } from 'lucide-react';

export default function ChatList({ chats, currentChatId, onSelectChat, onDeleteChat }) {
  return (
    <div className="flex flex-col gap-2 p-4 max-h-[300px] overflow-y-auto border-b custom-scrollbar">
      <h3 className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-2">
        <Clock className="w-4 h-4" />
        Recent Chats
      </h3>
      {chats.length === 0 ? (
        <div className="text-sm text-gray-500 text-center py-4">
          No recent chats
        </div>
      ) : (
        chats.map((chat) => (
          <div
            key={chat.id}
            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
              chat.id === currentChatId
                ? 'bg-purple-50 text-purple-700'
                : 'hover:bg-gray-50'
            }`}
            onClick={() => onSelectChat(chat.id)}
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm truncate">
                {chat.title || 'New Chat'}
              </span>
            </div>
            <button
              className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteChat(chat.id);
              }}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))
      )}
    </div>
  );
}