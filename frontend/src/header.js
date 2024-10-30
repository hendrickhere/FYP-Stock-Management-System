import React, { useEffect, useState } from 'react';
import { FaRegCircleUser } from "react-icons/fa6";
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";
import { IoIosNotificationsOutline } from "react-icons/io";
import { useNavigate, Link } from 'react-router-dom';
import { Alert, AlertDescription } from "./ui/alert";
import instance from "./axiosConfig";

function Header() {
  const [username, setUsername] = useState('user');
  const [userRole, setUserRole] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchCurrentUser() {
      try {
        const token = localStorage.getItem('accessToken');
        
        if (!token) {
          setIsLoading(false);
          navigate('/login');
          return;
        }

        const response = await instance.get('/user/current');
        if (response.status === 200) {
          setUsername(response.data.username);
          setUserRole(response.data.role);
        }
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem('accessToken');
          navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchCurrentUser();
  }, [navigate]);

  const handleChatClick = () => {
    navigate('/chatbot');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  if (isLoading) {
    return (
      <header className="flex justify-between items-center p-3 bg-white shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
        </div>
      </header>
    );
  }

  return (
    <>
      {error && (
        <Alert variant="destructive" className="mb-2">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <header className="sticky top-0 z-50 flex justify-between items-center px-4 py-3 bg-white shadow-sm">
        <div className="flex items-center space-x-3">
          <img 
            src={require('./logo.png')} 
            alt="StockSavvy Logo" 
            className="w-10 h-10"
          />
          <span className="text-xl font-bold">StockSavvy</span>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          <button 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors relative"
            aria-label="Notifications"
          >
            <IoIosNotificationsOutline className="w-7 h-7" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full hidden"></span>
          </button>

          <button 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            onClick={handleChatClick}
            aria-label="Chat"
          >
            <IoChatbubbleEllipsesOutline className="w-6 h-6" />
          </button>

          <div className="relative user-menu-container">
            <button 
              className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setShowUserMenu(!showUserMenu)}
              aria-label="User menu"
              aria-expanded={showUserMenu}
            >
              <FaRegCircleUser className="w-6 h-6 text-gray-600" />
              <div className="hidden sm:flex flex-col items-start">
                <span className="font-semibold max-w-[200px] truncate">
                  {username}
                </span>
                <span className="text-sm text-gray-500 -mt-1">
                  {userRole}
                </span>
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-100">
                <Link 
                  to="/profile" 
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                  onClick={() => setShowUserMenu(false)}
                >
                  Profile
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}

export default Header;