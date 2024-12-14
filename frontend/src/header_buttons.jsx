import React from 'react';
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";
import { IoNotificationsOutline } from "react-icons/io5";

const HeaderButtons = ({ onChatClick }) => {
  return (
    <div className="hidden lg:flex items-center space-x-4">
      {/* Notification Button */}
      <button
        className="group relative p-2 hover:bg-purple-50 rounded-full transition-all duration-200 cursor-pointer"
        aria-label="Notifications"
      >
        <IoNotificationsOutline className="w-7 h-6 text-gray-600 group-hover:text-purple-600 transition-colors duration-200" />
        
        {/* Notification Badge */}
        <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full hidden" />
        
        {/* Hover Tooltip */}
        <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
          Notifications
        </span>
      </button>

      {/* Chat Button */}
      <button
        className="group relative p-2 hover:bg-purple-50 rounded-full transition-all duration-200 cursor-pointer"
        onClick={onChatClick}
        aria-label="Chat"
      >
        <IoChatbubbleEllipsesOutline className="w-7 h-6 text-gray-600 group-hover:text-purple-600 transition-colors duration-200" />
        
        {/* Hover Tooltip */}
        <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
          Chatbot
        </span>
      </button>
    </div>
  );
};

export default HeaderButtons;