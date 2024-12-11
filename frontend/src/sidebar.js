import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaHome } from 'react-icons/fa';
import { MdOutlineInventory2 } from "react-icons/md";
import { AiOutlineStock } from "react-icons/ai";
import { BsCashCoin } from "react-icons/bs";
import { GrStakeholder, GrSchedules, GrLogout } from "react-icons/gr";
import { FaUsers, FaUserTie, FaUser } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const springTransition = {
  type: "spring",
  stiffness: 400,
  damping: 40,
  mass: 0.3,
  restDelta: 0.001
};

function Sidebar({ scrollDirection, isAtTop }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const isMinimized = scrollDirection === 'down' && !isAtTop;
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    sessionStorage.removeItem('userData');
    navigate('/login');
  };

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  const menuItems = [
    { path: '/dashboard', icon: FaHome, label: 'Dashboard' },
    { path: '/inventory', icon: MdOutlineInventory2, label: 'Inventory' },
    { path: '/sales', icon: AiOutlineStock, label: 'Sales' },
    { path: '/purchases', icon: BsCashCoin, label: 'Purchases' },
    { path: '/customers', icon: FaUsers, label: 'Customers' },
    { path: '/vendors', icon: FaUserTie, label: 'Vendors' },
    { path: '/staff', icon: FaUser, label: 'Staff' },
    { path: '/appointments', icon: GrSchedules, label: 'Appointments' },
    { path: '/warranty', icon: GrSchedules, label: 'Warranties' },
  ];

  // Don't render sidebar on mobile
  if (isMobile) {
    return null;
  }

  return (
    <>
      <motion.nav 
        className="fixed bottom-0 top-16 left-0 bg-[#38304C] text-white flex flex-col"
        animate={{ 
          width: isMinimized ? '4rem' : '13rem',
          x: 0
        }}
        transition={springTransition}
      >
        <ul className="list-none p-0 m-0 flex-grow flex flex-col mt-4">
          {menuItems.map(({ path, icon: Icon, label }) => (
            <li key={path} className="flex items-center relative my-2">
              <Link
                to={path}
                className={`
                  flex items-center 
                  ${isMinimized ? 'justify-center w-16' : 'w-[12rem] px-6'} 
                  text-base font-semibold 
                  no-underline py-3
                  ${isMinimized ? 'mx-auto' : 'ml-4'}
                  group 
                  ${isActiveRoute(path) 
                    ? 'bg-[#B9B4C7] text-black rounded-l-[30px]' 
                    : 'text-white hover:bg-[#B9B4C7] hover:text-black hover:rounded-l-[30px]'}
                  transition-all duration-300
                `}
              >
                <div className={`flex items-center justify-center flex-shrink-0 ${!isMinimized && 'mr-3'}`}>
                  <Icon className={`w-5 h-5 transition-colors ${
                    isActiveRoute(path) ? 'text-black' : 'text-white group-hover:text-black'
                  }`} />
                </div>
                {!isMinimized && (
                  <span className="whitespace-nowrap">{label}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>

        <motion.div 
          className="flex justify-end mb-5"
          animate={{ 
            marginRight: isMinimized ? '0.5rem' : '1rem',
            width: isMinimized ? '3rem' : 'auto'
          }}
        >
          <button 
            onClick={() => setShowLogoutAlert(true)}
            className={`
              group flex items-center justify-start
              ${isMinimized ? 'w-10 h-10' : 'w-[45px] h-[45px] hover:w-32'} 
              border-none rounded-full cursor-pointer 
              relative overflow-hidden transition-all duration-300 
              shadow-md bg-[#B9B4C7]
              ${!isMinimized && 'hover:rounded-[40px]'}
            `}
          >
            <div className={`
              w-full transition-all duration-300 
              flex items-center justify-center
              ${!isMinimized && 'group-hover:w-[30%] group-hover:pl-5'}
            `}>
              <GrLogout className="w-5 h-5 text-black" />
            </div>
            {!isMinimized && (
              <span className="absolute right-0 w-0 opacity-0 text-black text-base font-semibold transition-all duration-300 group-hover:opacity-100 group-hover:w-[70%] group-hover:pr-3">
                Logout
              </span>
            )}
          </button>
        </motion.div>
      </motion.nav>

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
    </>
  );
}

export default Sidebar;