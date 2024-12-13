import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdDiscount } from "react-icons/md";
import { Alert, AlertDescription } from "../ui/alert";
import { GlobalContext } from '../globalContext';
import { AlertCircle, Save, Ban } from "lucide-react";
import Header from '../header';
import Sidebar from '../sidebar';
import instance from '../axiosConfig';
import DiscountView from './view_discount';

function DiscountSettings() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex flex-col h-screen w-full">
      <Header />
      <div className="flex flex-row flex-grow">
        <Sidebar />
        <MainContent isMobile={isMobile} />
      </div>
    </div>
  );
}

const MainContent = () => {
  const navigate = useNavigate();
  const { organizationId } = useContext(GlobalContext);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDiscountEnding, setIsDiscountEnding] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [apiError, setApiError] = useState("");
  const [userData] = useState(() => {
    const cached = sessionStorage.getItem('userData');
    return cached ? JSON.parse(cached) : null;
  });

  const [formState, setFormState] = useState({
    discountRate: 0,
    discountName: "",
    organizationId: organizationId,
    discountStart: new Date().toISOString().split('T')[0],
    discountEnd: new Date().toISOString().split('T')[0],
    description: ""
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (formState.discountRate > 100) {
      newErrors.discountRate = "Discount rate cannot be greater than 100%.";
    }

    if (formState.discountRate < 1) {
      newErrors.discountRate = "Discount rate cannot be lesser than 1%.";
    }

    if (!formState.discountName) {
      newErrors.discountName = "Discount name cannot be empty!";
    }

    if (!formState.discountStart) {
      newErrors.discountStart = "Discount Start Date cannot be empty!";
    }

    if (isDiscountEnding) {
      if (normalizeDate(formState.discountEnd) < normalizeDate(formState.discountStart)) {
        newErrors.discountEnd = "Discount End Date cannot be earlier than discount start!";
      }
      if (normalizeDate(formState.discountEnd) < normalizeDate(new Date())) {
        newErrors.discountEnd = "Discount End Date cannot be earlier than today's date!";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const normalizeDate = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
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
        discountRate: formState.discountRate / 100,
        discountEnd: isDiscountEnding ? formState.discountEnd : null,
      };
      await instance.post(`/discount`, submissionData);
      navigate('/settings');
    } catch (error) {
      setApiError(
        error.response?.data?.message ||
        "Failed to create discount. Please try again."
      );
      console.error("Error creating discount:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <div className="p-6 space-y-6">
            {/* Title Section */}
            <div className="mb-8">
              <div className="flex items-center">
                <MdDiscount className="w-6 h-6 mr-2 text-gray-700 flex-shrink-0" />
                <h1 className="text-2xl font-bold text-gray-900 truncate">Discount Settings</h1>
              </div>
              <p className="text-gray-600 mt-1 truncate">Manage your discount configurations and rates</p>
            </div>

            {/* Error Alert */}
            {apiError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{apiError}</AlertDescription>
              </Alert>
            )}

            {/* Configuration Form Section */}
            <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Discount Configuration
              </h2>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {/* Rate Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Discount Rate (%)
                    </label>
                    <input
                      type="number"
                      name="discountRate"
                      value={formState.discountRate}
                      onChange={handleInputChange}
                      className={`w-full p-2 border rounded-md ${
                        errors.discountRate ? 'border-red-500' : 'border-gray-300'
                      } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                      placeholder="0.00"
                    />
                    {errors.discountRate && (
                      <p className="text-red-500 text-sm">{errors.discountRate}</p>
                    )}
                  </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Discount Name
              </label>
              <input
                type="text"
                name="discountName"
                value={formState.discountName}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-md ${
                  errors.discountName ? 'border-red-500' : 'border-gray-300'
                } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                placeholder="Enter discount name"
              />
              {errors.discountName && (
                <p className="text-red-500 text-sm">{errors.discountName}</p>
              )}
            </div>

            {/* Date Inputs */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                name="discountStart"
                value={formState.discountStart}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-md ${
                  errors.discountStart ? 'border-red-500' : 'border-gray-300'
                } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
              />
              {errors.discountStart && (
                <p className="text-red-500 text-sm">{errors.discountStart}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  End Date
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isDiscountEnding"
                    checked={isDiscountEnding}
                    onChange={(e) => setIsDiscountEnding(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="isDiscountEnding" className="text-sm text-gray-600">
                    Set end date
                  </label>
                </div>
              </div>
              {isDiscountEnding && (
                <>
                  <input
                    type="date"
                    name="discountEnd"
                    value={formState.discountEnd}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded-md ${
                      errors.discountEnd ? 'border-red-500' : 'border-gray-300'
                    } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                  />
                  {errors.discountEnd && (
                    <p className="text-red-500 text-sm">{errors.discountEnd}</p>
                  )}
                </>
              )}
            </div>

              <div className="col-span-1 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formState.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter discount description"
                />
              </div>
            </div>
          </form>
        </div>

          {/* Discount List */}
            <div className="pb-24">
              <DiscountView />
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

export default DiscountSettings;