import React, { useState, useEffect } from 'react';
import { useNavigate, Link, Routes, Route, Outlet } from 'react-router-dom';
import Header from '../header';
import Sidebar from '../sidebar';
import { IoSettingsSharp } from "react-icons/io5";
import { IoReceiptOutline } from "react-icons/io5";
import { MdDiscount } from "react-icons/md";
import { FaUsersCog } from "react-icons/fa";
import { TbNumbers } from "react-icons/tb";
import { Alert, AlertDescription } from "../ui/alert";
import { useScrollDirection } from '../useScrollDirection';
import { motion } from 'framer-motion';
import Tax from './tax';
import Discount from './discount';
import OrderSettings from './order';
import UserManagement from './userManagement';

const springTransition = {
  type: "spring",
  stiffness: 400,
  damping: 40,
  mass: 0.3,
  restDelta: 0.001
};

function Settings() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const { scrollDirection, isAtTop } = useScrollDirection();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex flex-col h-screen w-full">
      <Header scrollDirection={scrollDirection} isAtTop={isAtTop} />
      <div className="flex flex-row flex-grow">
        <Sidebar scrollDirection={scrollDirection} isAtTop={isAtTop} />
        <div className="flex-1">
          <Routes>
            <Route index element={
              <MainContent 
                isMobile={isMobile} 
                scrollDirection={scrollDirection} 
                isAtTop={isAtTop} 
              />
            } />
            <Route path="tax" element={
              <motion.div 
                className="p-6"
                animate={{ 
                  marginLeft: isMobile ? '0' : (scrollDirection === 'down' && !isAtTop ? '4rem' : '13rem'),
                }}
                transition={springTransition}
              >
                <Tax />
              </motion.div>
            } />
            <Route path="discount" element={
              <motion.div 
                className="p-6"
                animate={{ 
                  marginLeft: isMobile ? '0' : (scrollDirection === 'down' && !isAtTop ? '4rem' : '13rem'),
                }}
                transition={springTransition}
              >
                <Discount />
              </motion.div>
            } />
            <Route path="order-settings" element={
              <motion.div 
                className="p-6"
                animate={{ 
                  marginLeft: isMobile ? '0' : (scrollDirection === 'down' && !isAtTop ? '4rem' : '13rem'),
                }}
                transition={springTransition}
              >
                <OrderSettings />
              </motion.div>
            } />
            <Route path="user-management" element={
              <motion.div 
                className="p-6"
                animate={{ 
                  marginLeft: isMobile ? '0' : (scrollDirection === 'down' && !isAtTop ? '4rem' : '13rem'),
                }}
                transition={springTransition}
              >
                <UserManagement />
              </motion.div>
            } />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function MainContent({ isMobile, scrollDirection, isAtTop }) {
  const [userData] = useState(() => {
    const cached = sessionStorage.getItem('userData');
    return cached ? JSON.parse(cached) : null;
  });

  const navigate = useNavigate();

  // Define settings cards based on user role
  const settingsCards = [
    {
      title: 'Tax Settings',
      description: 'Configure tax rates and registration details',
      icon: IoReceiptOutline,
      path: 'tax',
      roles: ['admin', 'manager', 'Manager'] 
    },
    {
      title: 'Discount Settings',
      description: 'Manage discount rules and limitations',
      icon: MdDiscount,
      path: 'discount',
      roles: ['admin', 'manager', 'Manager']
    },
    {
      title: 'User Management',
      description: 'Manage user roles and permissions',
      icon: FaUsersCog,
      path: 'user-management',
      roles: ['admin']
    },
    {
      title: 'Order Settings',
      description: 'Configure order number formats and sequences',
      icon: TbNumbers,
      path: 'order-settings',
      roles: ['admin', 'manager', 'Manager']
    }
  ];

  if (!userData) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Please log in to access settings.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex-1 overflow-hidden">
      <div className="h-full overflow-y-auto">
        <motion.div 
          className="p-6"
          animate={{ 
            marginLeft: isMobile ? '0' : (scrollDirection === 'down' && !isAtTop ? '4rem' : '13rem'),
          }}
          transition={springTransition}
        >
          {/* Title Section */}
          <div className="mb-6">
            <div className="flex items-center">
              <IoSettingsSharp className="w-6 h-6 mr-2" />
              <h1 className="text-2xl font-bold">Settings</h1>
            </div>
          </div>

          {/* Settings Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {settingsCards.map((card, index) => (
            // Only show cards that the user has permission to access
            card.roles.some(role => role.toLowerCase() === userData?.role?.toLowerCase()) && (
              <Link
                key={index}
                to={card.path}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
              >
                <div className="flex items-center mb-4">
                  <card.icon className="w-8 h-8 text-[#38304C]" />
                  <h2 className="text-xl font-semibold ml-3">{card.title}</h2>
                </div>
                <p className="text-gray-600">{card.description}</p>
              </Link>
            )
          ))}
          </div>

          {/* Show message if user has no access to any settings */}
          {!settingsCards.some(card => card.roles.some(role => 
            role.toLowerCase() === userData?.role?.toLowerCase()
          )) && (
            <div className="bg-white rounded-lg shadow-md p-6 mt-4">
              <Alert>
                <AlertDescription>
                  You don't have access to any settings. Please contact your administrator.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default Settings;