import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TbNumbers } from "react-icons/tb";
import { Alert, AlertDescription } from "../ui/alert";
import { Ban, Save } from "lucide-react";
import Header from '../header';
import Sidebar from '../sidebar';

function OrderSettings() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden">
      <Header />
      <div className="flex flex-row flex-grow overflow-hidden">
        <Sidebar />
        <MainContent isMobile={isMobile} />
      </div>
    </div>
  );
}

const MainContent = ({ isMobile }) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userData] = useState(() => {
    const cached = sessionStorage.getItem('userData');
    return cached ? JSON.parse(cached) : null;
  });

  // Permission check
  if (!userData || !['admin', 'manager', 'Manager'].includes(userData?.role?.toLowerCase())) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          You don't have permission to access this page.
        </AlertDescription>
      </Alert>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => setIsSubmitting(false), 1000); // Simulated delay
  };

  return (
    <main className="flex-1 min-w-0">
      <div className="h-[calc(100vh-4rem)] overflow-y-auto overflow-x-hidden custom-scrollbar">
        <div className={`${isMobile ? "" : "ml-[13rem]"}`}>
          <div className="p-6 max-w-full">
            {/* Title Section */}
            <div className="mb-8">
              <div className="flex items-center">
                <TbNumbers className="w-6 h-6 mr-2 flex-shrink-0" />
                <h1 className="text-2xl font-bold text-gray-900 truncate">Order Number Settings</h1>
              </div>
              <p className="text-gray-600 mt-1 truncate">Configure order number formats for sales and purchases</p>
            </div>

            {/* Main Content */}
            <div className="space-y-6 pb-24">
              {/* Sales Order Section */}
              <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Sales Order Number Format</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Prefix</label>
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="SO"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Starting Number</label>
                    <input
                      type="number"
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="1001"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Separator</label>
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="-"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Number Padding</label>
                    <input
                      type="number"
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="4"
                    />
                  </div>
                </div>
              </div>

              {/* Purchase Order Section */}
              <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Purchase Order Number Format</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Prefix</label>
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="PO"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Starting Number</label>
                    <input
                      type="number"
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="1001"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Separator</label>
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="-"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Number Padding</label>
                    <input
                      type="number"
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="4"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Action Buttons */}
      <div 
        className="fixed bottom-0 bg-white border-t border-gray-200 p-4 z-10"
        style={{ 
          right: 0,
          left: isMobile ? 0 : '13rem',
          width: 'auto'
        }}
      >
        <div className="flex justify-end pr-4 gap-4">
          <button
            onClick={() => navigate("/settings")}
            className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={isSubmitting}
          >
            <Ban className="w-4 h-4 mr-2" />
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center px-4 py-2 text-white bg-primary hover:bg-primary/90 border border-transparent rounded-md shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </main>
  );
};

export default OrderSettings;