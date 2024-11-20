import React, {useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import { MdDiscount } from "react-icons/md";
import { Alert, AlertDescription } from "../ui/alert";

function DiscountSettings() {
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
          <MdDiscount className="w-6 h-6 mr-2" />
          <h1 className="text-2xl font-bold">Discount Settings</h1>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Discount Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Maximum Discount (%)</label>
              <input
                type="number"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="0.00"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Minimum Order Amount for Discount</label>
              <input
                type="number"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Discount Type</label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
                <option value="both">Both</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Discount Validity (Days)</label>
              <input
                type="number"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="30"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Applicable Products</label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                multiple
                size="3"
              >
                <option value="all">All Products</option>
                <option value="batteries">Batteries Only</option>
                <option value="services">Services Only</option>
              </select>
            </div>

            <div className="md:col-span-2">
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
    </div>
  );
}

export default DiscountSettings;