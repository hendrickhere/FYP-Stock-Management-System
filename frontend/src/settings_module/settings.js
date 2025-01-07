import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../header';
import Sidebar from '../sidebar';
import { IoSettingsSharp } from "react-icons/io5";
import { IoReceiptOutline } from "react-icons/io5";
import { MdDiscount } from "react-icons/md";
import { FaUsersCog } from "react-icons/fa";
import { TbNumbers, TbBuilding } from "react-icons/tb";
import { Alert, AlertDescription } from "../ui/alert";
import { useScrollDirection } from '../useScrollDirection';

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
    <div className="flex flex-col h-screen w-full overflow-hidden">
      <Header scrollDirection={scrollDirection} isAtTop={isAtTop} />
      <div className="flex flex-row flex-grow overflow-hidden"> 
        <Sidebar scrollDirection={scrollDirection} isAtTop={isAtTop} />
        <MainContent isMobile={isMobile} />
      </div>
    </div>
  );
}

function MainContent({ isMobile }) {
  const [userData] = useState(() => {
    const cached = sessionStorage.getItem('userData');
    return cached ? JSON.parse(cached) : null;
  });

  const settingsCards = [
    {
      title: 'Tax Settings',
      description: 'Configure tax rates and registration details',
      icon: IoReceiptOutline,
      path: '/settings/tax_settings', 
      roles: ['admin', 'manager', 'Manager'] 
    },
    {
      title: 'Discount Settings',
      description: 'Manage discount rules and limitations',
      icon: MdDiscount,
      path: '/settings/discount_settings', 
      roles: ['admin', 'manager', 'Manager']
    },
    {
      title: 'User Management',
      description: 'Manage user roles and permissions',
      icon: FaUsersCog,
      path: '/settings/user_management', 
      roles: ['admin']
    },
    {
      title: 'Order Settings',
      description: 'Configure order number formats and sequences',
      icon: TbNumbers,
      path: '/settings/order_settings', 
      roles: ['admin', 'manager', 'Manager']
    },
    {
      title: 'Organization Settings',
      description: 'Edit organization settings',
      icon: TbBuilding,
      path: '/settings/organization_settings', 
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
    <main className="flex-1 min-w-0">
      <div className="h-[calc(100vh-4rem)] overflow-y-auto overflow-x-hidden">
        <div className={`${isMobile ? "" : "ml-[13rem]"}`}>
          <div className="p-6 max-w-full">
            {/* Title Section */}
            <div className="mb-8 max-w-full">
              <div className="flex items-center">
                <IoSettingsSharp className="w-6 h-6 mr-2 flex-shrink-0" />
                <h1 className="text-2xl font-bold text-gray-900 sm:line-clamp-1 sm:truncate">Settings</h1>
              </div>
              <p className="text-gray-600 mt-1 sm:line-clamp-1 sm:truncate">Configure your system settings and preferences</p>
            </div>

            {/* Settings Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 min-w-0">
              {settingsCards.map((card, index) => (
                card.roles.some(role => role.toLowerCase() === userData?.role?.toLowerCase()) && (
                  <Link
                    key={index}
                    to={card.path}
                    className="bg-white rounded-lg shadow-md p-4 md:p-6 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] w-full"
                  >
                    <div className="flex items-center mb-4 min-w-0">
                      <card.icon className="w-6 h-6 md:w-8 md:h-8 text-[#38304C] flex-shrink-0" />
                      <h2 className="text-lg md:text-xl font-semibold ml-3 line-clamp-1">{card.title}</h2>
                    </div>
                    <p className="text-gray-600 text-sm md:text-base sm:line-clamp-1 sm:truncate">{card.description}</p>
                  </Link>
                )
              ))}
            </div>

            {/* No Access Message */}
            {!settingsCards.some(card => card.roles.some(role => 
              role.toLowerCase() === userData?.role?.toLowerCase()
            )) && (
              <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mt-4">
                <Alert>
                  <AlertDescription>
                    You don't have access to any settings. Please contact your administrator.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default Settings;