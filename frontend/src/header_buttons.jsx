import React, { useEffect, useRef } from 'react';
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";
import { IoNotificationsOutline } from "react-icons/io5";

const HeaderButtons = ({ onChatClick, notifications = [], onNotificationClick, onMarkAllAsRead, showNotifications, setShowNotifications }) => {
  const unreadCount = notifications.filter(n => !n.read).length;
  const notificationRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setShowNotifications]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const handleNotificationClick = (id) => {
    onNotificationClick(id);
    setShowNotifications(false);
  };

  const handleMarkAllAsRead = (e) => {
    e?.stopPropagation();
    onMarkAllAsRead();
  };

  return (
    <div className="hidden lg:flex items-center space-x-4">
      {/* Notification Button */}
      <div className="relative" ref={notificationRef}>
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className={`group relative p-2 hover:bg-purple-50 rounded-full transition-all duration-200 cursor-pointer ${showNotifications ? 'bg-purple-50' : ''}`}
          aria-label="Notifications"
        >
          <IoNotificationsOutline className="w-7 h-6 text-gray-600 group-hover:text-purple-600 transition-colors duration-200" />
          
          {/* Notification Badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full">
              {unreadCount}
            </span>
          )}
          
          {/* Hover Tooltip - Only show when dropdown is not visible */}
          {!showNotifications && (
            <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
              Notifications
            </span>
          )}
        </button>

        {/* Notification Dropdown */}
        {showNotifications && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-100 z-50 max-h-96 overflow-y-auto">
            <div className="p-3 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="font-semibold text-gray-700">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-purple-600 hover:text-purple-700"
                >
                  Mark all as read
                </button>
              )}
            </div>
            
            <div className="divide-y divide-gray-100">
              {notifications.length > 0 ? (
                notifications.map(notification => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification.id)}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors relative ${
                      notification.urgency === 'high' ? 'bg-red-50 hover:bg-red-100' : 
                      notification.type === 'expiry' ? 'bg-yellow-50 hover:bg-yellow-100' : ''
                    }`}
                  >
                    {!notification.read && (
                      <span className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full" />
                    )}
                    <div className="space-y-1">
                      <div className="font-medium text-gray-800 flex items-center gap-2">
                        {notification.title}
                      </div>
                      <p className="text-sm text-gray-600">{notification.message}</p>
                      <div className="text-xs text-gray-400 flex justify-between items-center">
                        <span>{formatDate(notification.date)}</span>
                        {notification.type === 'expiry' && (
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            notification.urgency === 'high' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {notification.urgency === 'high' ? 'Urgent' : 'Warning'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">
                  No notifications
                </div>
              )}
            </div>
          </div>
        )}
      </div>

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