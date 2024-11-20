import React, { useEffect, useState } from 'react';
import { FaUsers, FaUserTie, FaUser } from 'react-icons/fa';  
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";
import { IoIosNotificationsOutline } from "react-icons/io";
import { IoMenu } from "react-icons/io5";
import { MdOutlineInventory2 } from "react-icons/md";
import { AiOutlineStock } from "react-icons/ai";
import { BsCashCoin } from "react-icons/bs";
import { AlertTriangle } from 'lucide-react';
import { GrStakeholder, GrSchedules, GrLogout } from "react-icons/gr";
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Alert, AlertDescription } from "./ui/alert";
import instance from "./axiosConfig";
import { motion } from 'framer-motion';

function Header({ scrollDirection, isAtTop }) {
  const [username, setUsername] = useState('user');
  const [userRole, setUserRole] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const [showSessionExpiredAlert, setShowSessionExpiredAlert] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const [userData, setUserData] = useState(() => {
    const cached = sessionStorage.getItem('userData');
    return cached ? JSON.parse(cached) : null;
  });

  const menuItems = [
    { path: '/dashboard', icon: FaUser, label: 'Dashboard' },
    { path: '/inventory', icon: MdOutlineInventory2, label: 'Inventory' },
    { path: '/sales', icon: AiOutlineStock, label: 'Sales' },
    { path: '/purchases', icon: BsCashCoin, label: 'Purchases' },
    { path: '/customers', icon: FaUsers, label: 'Customers' },
    { path: '/vendors', icon: FaUserTie, label: 'Vendors' },
    { path: '/staff', icon: FaUser, label: 'Staff' },
    { path: '/appointments', icon: GrSchedules, label: 'Appointments' },
  ];

  const handleSessionExpired = () => {
    localStorage.removeItem('accessToken');
    sessionStorage.removeItem('userData');
    setShowSessionExpiredAlert(true);
    
    // Auto-dismiss after 3 seconds and redirect
    setTimeout(() => {
      setShowSessionExpiredAlert(false);
      navigate('/login', { 
        state: { 
          message: 'Your session has expired. Please log in again for security reasons.' 
        } 
      });
    }, 3000);
  };

  useEffect(() => {
    async function fetchCurrentUser() {
      try {
        const token = localStorage.getItem('accessToken');
        
        if (!token) {
          setIsLoading(false);
          navigate('/login');
          return;
        }

        // Check if we have cached data
        if (userData) {
          setUsername(userData.username);
          setUserRole(userData.role);
          setIsLoading(false);
          return;
        }

        const response = await instance.get('/user/current');
        if (response.status === 200) {
          const data = {
            username: response.data.username,
            role: response.data.role
          };
          // Cache the data
          sessionStorage.setItem('userData', JSON.stringify(data));
          setUserData(data);
          setUsername(data.username);
          setUserRole(data.role);
        }
      } catch (error) {
        if (error.response?.status === 401) {
          handleSessionExpired();
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchCurrentUser();

    // Set up interval to check token periodically
    const tokenCheckInterval = setInterval(fetchCurrentUser, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(tokenCheckInterval);
  }, [navigate, userData]);

  // Clear cache on logout
  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    sessionStorage.removeItem('userData');
    navigate('/login');
  };

  const handleChatClick = () => {
    navigate('/chatbot');
    setShowMobileMenu(false);
  };

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  if (isLoading) {
    return (
      <>
        <header className="sticky top-0 z-50 bg-white shadow-sm">
          <div className="flex justify-between items-center px-3 md:px-4 py-2 md:py-3">
            {/* Logo Section - Keep exact same structure */}
            <div className="flex items-center space-x-2 md:space-x-3">
              <img 
                src={require('./logo.png')} 
                alt="StockSavvy Logo" 
                className="w-8 h-8 md:w-10 md:h-10"
              />
              <span className="text-lg md:text-xl font-bold">StockSavvy</span>
            </div>

            {/* Mobile Menu Button Placeholder */}
            <div className="lg:hidden w-10 h-10" />

            {/* Desktop Actions Placeholder */}
            <div className="hidden lg:flex items-center space-x-4">
              <div className="w-10 h-10 bg-gray-100 rounded-full animate-pulse" />
              <div className="w-10 h-10 bg-gray-100 rounded-full animate-pulse" />
              <div className="w-48 h-10 bg-gray-100 rounded-lg animate-pulse" />
            </div>
          </div>
        </header>
      </>
    );
  }
    console.log('Header scroll props:', { 
    scrollDirection, 
    isAtTop,
    shouldHide: scrollDirection === 'down' && !isAtTop 
  });

  return (
    <>
      {showSessionExpiredAlert && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-100 border-b border-yellow-200">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Your session has expired. Logging out for security reasons...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {error && (
        <Alert variant="destructive" className="mb-2">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <motion.header 
        className="sticky top-0 z-50 bg-white shadow-sm"
      >
        {/* Main Header */}
      <div className="flex justify-between items-center px-3 md:px-4 py-2 md:py-3">
          {/* Logo Section */}
          <div className="flex items-center space-x-2 md:space-x-3">
            <img 
              src={require('./logo.png')} 
              alt="StockSavvy Logo" 
              className="w-8 h-8 md:w-10 md:h-10"
            />
            <span className="text-lg md:text-xl font-bold">StockSavvy</span>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="lg:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            aria-label="Menu"
          >
            <IoMenu className="w-6 h-6" />
          </button>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center space-x-4">
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
                <FaUser className="w-6 h-6 text-gray-600" />
                <div className="flex flex-col items-start">
                  <span className="font-semibold max-w-[150px] truncate">
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
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className={`
            lg:hidden fixed inset-0 top-[57px] bg-white z-50 overflow-y-auto mobile-menu-container
            transition-transform duration-300 ease-in-out
            ${showMobileMenu ? 'translate-x-0' : 'translate-x-full'}
          `}>
            <div className="px-4 py-3 space-y-4 max-w-lg mx-auto">
              {/* Mobile User Info */}
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <FaUser className="w-6 h-6 text-gray-600" />
                <div>
                  <div className="font-semibold">{username}</div>
                  <div className="text-sm text-gray-500">{userRole}</div>
                </div>
              </div>

              {/* Navigation Menu Items */}
              <div className="space-y-2">
                {menuItems.map(({ path, icon: Icon, label }) => (
                  <Link
                    key={path}
                    to={path}
                    className={`
                      flex items-center space-x-4 p-4 rounded-lg
                      ${isActiveRoute(path)
                        ? 'bg-[#38304C] text-white'
                        : 'text-gray-700 hover:bg-gray-50'}
                      transition-colors duration-150
                    `}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <Icon className={`w-5 h-5 ${isActiveRoute(path) ? 'text-white' : 'text-gray-500'}`} />
                    <span className="font-medium">{label}</span>
                  </Link>
                ))}
              </div>

              {/* Actions Section */}
              <div className="space-y-2 border-t border-gray-100 pt-4">
                <Link 
                  to="/profile" 
                  className="flex items-center space-x-4 p-4 text-gray-700 hover:bg-gray-50 rounded-lg"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <FaUser className="w-5 h-5 text-gray-500" />
                  <span className="font-medium">Profile</span>
                </Link>

                <button 
                  className="flex items-center space-x-4 w-full p-4 text-gray-700 hover:bg-gray-50 rounded-lg"
                  onClick={handleChatClick}
                >
                  <IoChatbubbleEllipsesOutline className="w-5 h-5 text-gray-500" />
                  <span className="font-medium">Chat</span>
                </button>

                <button 
                  className="flex items-center space-x-4 w-full p-4 text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  <IoIosNotificationsOutline className="w-5 h-5 text-gray-500" />
                  <span className="font-medium">Notifications</span>
                </button>

                <button 
                  className="flex items-center space-x-4 w-full p-4 text-red-600 hover:bg-red-50 rounded-lg"
                  onClick={() => setShowLogoutAlert(true)}
                >
                  <GrLogout className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.header>

      {/* Add styles for the progress bar animation */}
      <style>
        {`
          @keyframes progress {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          .animate-progress {
            animation: progress 1s infinite linear;
          }
        `}
      </style>

      {/* Logout Alert Modal */}
      {showLogoutAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirm Logout</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to logout? You'll need to login again to access your account.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowLogoutAlert(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleLogout();
                  setShowLogoutAlert(false);
                }}
                className="px-4 py-2 bg-red-500 text-white font-medium rounded-md hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay for mobile menu */}
      {showMobileMenu && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setShowMobileMenu(false)}
        />
      )}
    </>
  );
}

export default Header;