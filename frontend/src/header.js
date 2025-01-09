import React, { useEffect, useState, useRef } from 'react';
import { FaUsers, FaUserTie, FaUsersCog } from 'react-icons/fa';  
import { IoChatbubbleEllipsesOutline, IoReceiptOutline } from "react-icons/io5";
import { IoIosNotificationsOutline } from "react-icons/io";
import { IoMenu, IoSettingsSharp } from "react-icons/io5";
import { MdOutlineInventory2, MdDashboard, MdDiscount } from "react-icons/md";
import { AiOutlineStock } from "react-icons/ai";
import { BsCashCoin } from "react-icons/bs";
import { AlertTriangle } from 'lucide-react';
import { GrSchedules, GrLogout } from "react-icons/gr";
import { RiShieldCheckLine } from "react-icons/ri";
import { CgProfile } from "react-icons/cg";
import { TbNumbers } from "react-icons/tb";
import HeaderButtons from './header_buttons';
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
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [lastFetchTime, setLastFetchTime] = useState(null);

  const userMenuRef = useRef(null);
  const settingsMenuRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  const [userData, setUserData] = useState(() => {
    const cached = sessionStorage.getItem('userData');
    return cached ? JSON.parse(cached) : null;
  });

  // Main navigation items
  const menuItems = [
    { path: '/dashboard', icon: MdDashboard, label: 'Dashboard' },
    { path: '/inventory', icon: MdOutlineInventory2, label: 'Inventory' },
    { path: '/sales', icon: AiOutlineStock, label: 'Sales' },
    { path: '/purchases', icon: BsCashCoin, label: 'Purchases' },
    { path: '/customers', icon: FaUsers, label: 'Customers' },
    { path: '/vendors', icon: FaUserTie, label: 'Vendors' },
    { path: '/staff', icon: FaUsersCog, label: 'Staff' },
    { path: '/appointments', icon: GrSchedules, label: 'Appointments' },
    { path: '/warranty', icon: RiShieldCheckLine, label: 'Warranties' },
    { path: '/profile', icon: CgProfile, label: 'Profile' },
    { path: '/settings', icon: IoSettingsSharp, label: 'Settings' }, 
  ];

  // Settings menu items with role-based access
  const settingsItems = [
    { 
      path: '/settings/tax', 
      icon: IoReceiptOutline, 
      label: 'Tax',
      roles: ['admin', 'manager']
    },
    { 
      path: '/settings/discount', 
      icon: MdDiscount, 
      label: 'Discount',
      roles: ['admin', 'manager']
    },
    { 
      path: '/settings/user-management', 
      icon: FaUsersCog, 
      label: 'User Management',
      roles: ['admin']
    },
    { 
      path: '/settings/order-settings', 
      icon: TbNumbers, 
      label: 'Order Settings',
      roles: ['admin', 'manager']
    }
  ];

  // Click outside handlers
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target)) {
        setShowSettingsMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      const updatedUserData = JSON.parse(sessionStorage.getItem('userData'));
      if (updatedUserData) {
        setUsername(updatedUserData.username);
        setUserRole(updatedUserData.role);
      }
    };
  
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleSessionExpired = () => {
    localStorage.removeItem('accessToken');
    sessionStorage.removeItem('userData');
    setShowSessionExpiredAlert(true);
    
    setTimeout(() => {
      setShowSessionExpiredAlert(false);
      navigate('/login', { 
        state: { 
          message: 'Your session has expired. Please log in again for security reasons.' 
        } 
      });
    }, 3000);
  };

  // User data fetch effect
  useEffect(() => {
    async function fetchCurrentUser() {
      try {
        const token = localStorage.getItem('accessToken');
        
        if (!token) {
          setIsLoading(false);
          navigate('/login');
          return;
        }

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
    const tokenCheckInterval = setInterval(fetchCurrentUser, 5 * 60 * 1000);
    return () => clearInterval(tokenCheckInterval);
  }, [navigate, userData]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    sessionStorage.removeItem('userData');
    navigate('/login');
  };

  const handleChatClick = () => {
    navigate('/chatbot');
    setShowMobileMenu(false);
  };

  // Fetch expiring products and convert to notifications
  const fetchExpiringProducts = async () => {
    try {
      console.log('Fetching expiring products...');
      console.log('API URL:', instance.defaults.baseURL);
      const response = await instance.get('/products/expiring');
      console.log('Expiring products response:', response.data);
      const expiringProducts = response.data;
      
      const currentTime = new Date().toISOString();
      
      const newNotifications = expiringProducts.map(product => ({
        id: `expiry-${product.id}-${product.expiryDate}`,
        title: `${product.urgency === 'high' ? '🚨' : '⚠️'} Product Expiring Soon`,
        message: `${product.name} (${product.sku || 'No SKU'}) - ${product.stock} units will expire in ${product.daysUntilExpiry} days`,
        date: currentTime,
        read: false,
        type: 'expiry',
        urgency: product.urgency,
        productId: product.id,
        link: `/inventory?product=${product.id}`
      }));

      console.log('New notifications:', newNotifications);

      setNotifications(prev => {
        // Keep existing non-expiry notifications
        const existingNonExpiry = prev.filter(n => n.type !== 'expiry');
        const merged = [...existingNonExpiry, ...newNotifications];
        console.log('Updated notifications:', merged);
        return merged;
      });

      setLastFetchTime(currentTime);
    } catch (error) {
      console.error('Failed to fetch expiring products:', error);
    }
  };

  // Fetch notifications periodically
  useEffect(() => {
    console.log('Setting up notification fetching...');
    fetchExpiringProducts();
    const interval = setInterval(fetchExpiringProducts, 30 * 60 * 1000); // Every 30 minutes
    
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = (notification) => {
    // Mark as read
    setNotifications(prev =>
      prev.map(n => (n.id === notification.id ? { ...n, read: true } : n))
    );

    // Navigate if there's a link
    if (notification.link) {
      navigate(notification.link);
    }
    
    setShowNotifications(false);
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  const unreadCount = notifications.filter(notification => !notification.read).length;

  if (isLoading) {
    return (
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="flex justify-between items-center px-3 md:px-4 py-2 md:py-3">
          <div className="flex items-center space-x-2 md:space-x-3">
            <img 
              src={require('./logo.png')} 
              alt="StockSavvy Logo" 
              className="w-8 h-8 md:w-10 md:h-10"
            />
            <span className="text-lg md:text-xl font-bold">StockSavvy</span>
          </div>
          <div className="lg:hidden w-10 h-10" />
          <div className="hidden lg:flex items-center space-x-4">
            <div className="w-10 h-10 bg-gray-100 rounded-full animate-pulse" />
            <div className="w-10 h-10 bg-gray-100 rounded-full animate-pulse" />
            <div className="w-48 h-10 bg-gray-100 rounded-lg animate-pulse" />
          </div>
        </div>
      </header>
    );
  }

  // Desktop user menu
  const renderDesktopUserMenu = () => (
    <div 
      ref={userMenuRef}
      className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-100"
    >
      <Link 
        to="/profile" 
        className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
        onClick={() => setShowUserMenu(false)}
      >
        <CgProfile className="w-5 h-5 mr-2" />
        <span>Profile</span>
      </Link>

      <Link
        to="/settings"
        className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
        onClick={() => setShowUserMenu(false)}
      >
        <IoSettingsSharp className="w-5 h-5 mr-2" />
        <span>Settings</span>
      </Link>
    </div>
  );

  // Mobile menu
  const renderMobileMenu = () => (
    <div className={`lg:hidden fixed inset-0 top-[57px] bg-white z-50 overflow-y-auto transition-transform duration-300 ease-in-out ${showMobileMenu ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="px-4 py-3 space-y-4 max-w-lg mx-auto">
        {/* User Info with Quick Actions */}
        <div className="bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3 p-3">
            <CgProfile className="w-6 h-6 text-gray-600" />
            <div>
              <div className="font-semibold">{username}</div>
              <div className="text-sm text-gray-500">{userRole}</div>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="flex justify-around border-t border-gray-200 p-2">
            <button 
              onClick={handleChatClick}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <IoChatbubbleEllipsesOutline className="w-5 h-5" />
            </button>
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors relative"
              >
                <IoIosNotificationsOutline className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Mobile Notification Panel */}
              {showNotifications && (
                <div className="fixed inset-x-0 top-[57px] mx-4 bg-white rounded-lg shadow-lg border border-gray-100 z-50 max-h-[calc(100vh-120px)] overflow-y-auto">
                  <div className="p-3 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
                    <h3 className="font-semibold text-gray-700">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAllAsRead();
                        }}
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
                          onClick={() => {
                            handleNotificationClick(notification);
                            setShowNotifications(false);
                          }}
                          className="p-4 hover:bg-gray-50 cursor-pointer transition-colors relative"
                        >
                          {!notification.read && (
                            <span className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full" />
                          )}
                          <div className="space-y-1">
                            <div className="font-medium text-gray-800">{notification.title}</div>
                            <p className="text-sm text-gray-600">{notification.message}</p>
                            <div className="text-xs text-gray-400">{notification.date}</div>
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
          </div>
        </div>

        {/* Settings Menu (if open) */}
        {showSettingsMenu && (
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-3 border-b border-gray-200">
              <h3 className="font-semibold">Settings</h3>
            </div>
            <div className="p-2 space-y-1">
              {settingsItems.map(item => (
                userData && item.roles.includes(userData.role) && (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="flex items-center p-2 text-gray-700 hover:bg-gray-100 rounded-md"
                    onClick={() => {
                      setShowSettingsMenu(false);
                      setShowMobileMenu(false);
                    }}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    <span>{item.label}</span>
                  </Link>
                )
              ))}
            </div>
          </div>
        )}

        {/* Main Navigation */}
        <div className="space-y-2">
          {menuItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`flex items-center space-x-4 p-4 rounded-lg ${isActiveRoute(path) ? 'bg-[#38304C] text-white' : 'text-gray-700 hover:bg-gray-50'} transition-colors duration-150`}
              onClick={() => setShowMobileMenu(false)}
            >
              <Icon className={`w-5 h-5 ${isActiveRoute(path) ? 'text-white' : 'text-gray-500'}`} />
              <span className="font-medium">{label}</span>
            </Link>
          ))}
        </div>

        {/* Settings at the bottom */}
        <div className="mt-4 space-y-2">
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
  );

  return (
    <>
      {showSessionExpiredAlert && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-100 border-b border-yellow-200">
          <div className="max-w-7xl mx-auto px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                <p className="ml-3 text-sm text-yellow-700">
                  Your session has expired. Logging out for security reasons...
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="mb-1">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <motion.header className="sticky top-0 z-50 bg-white shadow-sm h-16">
        <div className="flex justify-between items-center px-3 md:px-4 h-full">
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
            <HeaderButtons 
              onChatClick={handleChatClick} 
              notifications={notifications}
              onNotificationClick={handleNotificationClick}
              onMarkAllAsRead={handleMarkAllAsRead}
              showNotifications={showNotifications}
              setShowNotifications={setShowNotifications}
            />

            <div className="relative user-menu-container">
              <button 
                className="flex items-center space-x-2 p-2 hover:bg-purple-50 rounded-full transition-all duration-200 cursor-pointer"
                onClick={() => setShowUserMenu(!showUserMenu)}
                aria-label="User menu"
                aria-expanded={showUserMenu}
              >
                <CgProfile className="w-6 h-6 text-gray-600 group-hover:text-purple-600 transition-colors duration-200" />
                <div className="flex items-center space-x-2">
                  <span className="font-semibold max-w-[150px] truncate">
                    {username}
                  </span>
                  {userRole && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {userRole}
                    </span>
                  )}
                </div>
              </button>

              {showUserMenu && renderDesktopUserMenu()}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="lg:hidden fixed inset-0 top-16 bg-white z-50 overflow-y-auto">
            {renderMobileMenu()}
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