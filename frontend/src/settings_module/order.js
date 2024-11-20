import React, {useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import { TbNumbers } from "react-icons/tb";
import { Alert, AlertDescription } from "../ui/alert";

function OrderSettings() {
  const [userData] = useState(() => {
    const cached = sessionStorage.getItem('userData');
    return cached ? JSON.parse(cached) : null;
  });
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!userData || !['admin', 'manager', 'Manager'].includes(userData?.role?.toLowerCase())) {
      navigate('/settings');
      return;
    }
  }, [userData, navigate]);

  if (!userData || !['admin', 'manager', 'Manager'].includes(userData?.role?.toLowerCase())) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          You don't have permission to access this page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-8rem)] overflow-y-auto">
      <div className="min-h-full">
        <div className="flex items-center mb-6">
          <TbNumbers className="w-6 h-6 mr-2" />
          <h1 className="text-2xl font-bold">Order Number Settings</h1>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="space-y-8">
            {/* Sales Order Section */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Sales Order Number Format</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Prefix</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="SO"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Starting Number</label>
                  <input
                    type="number"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="1001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Separator</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="-"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Number Padding</label>
                  <input
                    type="number"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="4"
                  />
                </div>
              </div>
            </div>

            {/* Purchase Order Section */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Purchase Order Number Format</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Prefix</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="PO"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Starting Number</label>
                  <input
                    type="number"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="1001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Separator</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="-"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Number Padding</label>
                  <input
                    type="number"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="4"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6 space-x-3">
              <button 
                onClick={() => navigate('/settings')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button 
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-[#38304C] border border-transparent rounded-md shadow-sm hover:bg-[#2A2338] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#38304C]"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderSettings;