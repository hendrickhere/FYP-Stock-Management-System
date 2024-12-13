import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoReceipt } from "react-icons/io5";
import instance from '../axiosConfig';
import { GlobalContext } from '../globalContext';
import { Alert, AlertDescription } from "../ui/alert";
import { AlertCircle, Save, Ban } from "lucide-react";
import Header from '../header';
import Sidebar from '../sidebar';
import TaxView from './view_tax';

function Tax() {
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

const MainContent = () => {
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const { organizationId } = useContext(GlobalContext);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [userData] = useState(() => {
    const cached = sessionStorage.getItem('userData');
    return cached ? JSON.parse(cached) : null;
  });

  const [formState, setFormState] = useState({
    taxName: "",
    taxRate: 0,
    description: "",
    organizationId: organizationId,
  });

  const validateForm = () => {
    const newErrors = {};
    
    if (formState.taxRate > 100) {
      newErrors.taxRate = "Tax rate cannot be greater than 100%.";
    }

    if (formState.taxRate < 1) {
      newErrors.taxRate = "Tax rate cannot be lesser than 1%.";
    }

    if (!formState.taxName) {
      newErrors.taxName = "Tax name cannot be empty!";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setApiError(null);

    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }
    
    try {
      const submissionData = {
        ...formState,
        taxRate: formState.taxRate / 100
      };
      await instance.post(`/tax`, submissionData);
      navigate('/settings');
    } catch (error) {
      setApiError(
        error.response?.data?.message ||
        "Failed to create tax configuration. Please try again."
      );
      console.error("Error creating tax configuration:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

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

  return (
    <main className="flex-1 min-w-0">
      <div className="h-[calc(100vh-4rem)] overflow-y-auto overflow-x-hidden custom-scrollbar">
        <div className={`${isMobile ? "" : "ml-[13rem]"}`}>
          <div className="p-6 space-y-6 max-w-full">
            {/* Title Section */}
            <div className="mb-8">
              <div className="flex items-center ">
                <IoReceipt className="w-6 h-6 mr-2 flex-shrink-0" />
                <h1 className="text-2xl font-bold text-gray-900 truncate">Tax Settings</h1>
              </div>
              <p className="text-gray-600 mt-1 truncate">Manage your tax rates and configurations</p>
            </div>

            {/* Error Alert */}
            {apiError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{apiError}</AlertDescription>
              </Alert>
            )}

            {/* Tax Configuration Form */}
            <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Tax Configuration
              </h2>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {/* Tax Rate Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Default Tax Rate (%)
                    </label>
                    <input
                      type="number"
                      name="taxRate"
                      value={formState.taxRate}
                      onChange={handleFormChange}
                      className={`w-full p-2 border rounded-md ${
                        errors.taxRate ? 'border-red-500' : 'border-gray-300'
                      } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                      placeholder="0.00"
                    />
                    {errors.taxRate && (
                      <p className="text-red-500 text-sm">{errors.taxRate}</p>
                    )}
                  </div>

                  {/* Tax Name Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Tax Name
                    </label>
                    <input
                      type="text"
                      name="taxName"
                      value={formState.taxName}
                      onChange={handleFormChange}
                      className={`w-full p-2 border rounded-md ${
                        errors.taxName ? 'border-red-500' : 'border-gray-300'
                      } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                      placeholder="Enter tax name"
                    />
                    {errors.taxName && (
                      <p className="text-red-500 text-sm">{errors.taxName}</p>
                    )}
                  </div>

                  {/* Description Input */}
                  <div className="col-span-1 md:col-span-2">
                    <label className="text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formState.description}
                      onChange={handleFormChange}
                      rows={3}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter tax description"
                    />
                  </div>
                </div>
              </form>
            </div>

            {/* Tax List View with padding for fixed buttons */}
            <div className="pb-24">
              <TaxView />
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Action Buttons */}
      <div className="fixed bottom-0 right-0 bg-white border-t p-4 z-10" 
           style={{ left: isMobile ? '0' : '13rem' }}>
        <div className="max-w-7xl mx-auto flex justify-end space-x-4">
          <button
            onClick={() => navigate("/settings")}
            className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={isSubmitting}
          >
            <Ban className="w-4 h-4 mr-2" />
            Cancel
          </button>
          <button
            onClick={handleFormSubmit}
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

export default Tax;