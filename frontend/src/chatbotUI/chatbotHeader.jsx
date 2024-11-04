import React, { useState, useRef, useEffect } from "react";
import { Bot, Plus, Clock, MessageSquare, ChevronDown, Pencil, Trash2, Check, X } from 'lucide-react';
import ChatList from "./chatList";

export default function ChatbotHeader({ 
  isOnline, 
  onNewChat, 
  currentChatId, 
  chats, 
  onSelectChat, 
  onDeleteChat,
  onEditChatTitle,
  isMobile
}) {
  const [showRecentChats, setShowRecentChats] = useState(false);
  const [editingChatId, setEditingChatId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const editInputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowRecentChats(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when editing starts
  useEffect(() => {
    if (editingChatId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingChatId]);

  const handleStartEdit = (chat) => {
    setEditingChatId(chat.id);
    setEditTitle(chat.title);
  };

  const handleSaveEdit = () => {
    if (editTitle.trim()) {
      onEditChatTitle(editingChatId, editTitle.trim());
    }
    setEditingChatId(null);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setEditingChatId(null);
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  return (
    <div className="bg-white border-b border-gray-200">
      <div className={`
        flex items-center justify-between
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
        
        <div className="flex items-center gap-1 sm:gap-2 relative" ref={dropdownRef}>
          {chats.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowRecentChats(!showRecentChats)}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Recent</span>
                <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform ${showRecentChats ? 'transform rotate-180' : ''}`} />
              </button>
              
              {/* Recent Chats Dropdown */}
              {showRecentChats && (
                <div className="absolute right-0 top-full mt-1 w-48 sm:w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="max-h-[300px] overflow-y-auto">
                    {chats.map((chat) => (
                      <div
                        key={chat.id}
                        className={`group flex items-center justify-between p-2 hover:bg-gray-50 ${
                          chat.id === currentChatId ? 'bg-purple-50' : ''
                        }`}
                      >
                        {editingChatId === chat.id ? (
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              ref={editInputRef}
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onKeyDown={handleKeyPress}
                              className="flex-1 px-2 py-1 text-sm border rounded"
                              autoFocus
                            />
                            <button
                              onClick={handleSaveEdit}
                              className="p-1 text-green-600 hover:text-green-700"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingChatId(null)}
                              className="p-1 text-red-600 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              className="flex items-center gap-2 flex-1 text-left"
                              onClick={() => {
                                onSelectChat(chat.id);
                                setShowRecentChats(false);
                              }}
                            >
                              <MessageSquare className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-700 truncate">
                                {chat.title}
                              </span>
                            </button>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartEdit(chat);
                                }}
                                className="p-1 text-gray-400 hover:text-gray-600"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteChat(chat.id);
                                }}
                                className="p-1 text-gray-400 hover:text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <button
            onClick={onNewChat}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </div>
      </div>
    </div>
  );
}