import React, {useState, useEffect, useContext} from 'react';
import { useNavigate } from 'react-router-dom';
import { MdDiscount } from "react-icons/md";
import { Alert, AlertDescription } from "../ui/alert";
import { GlobalContext } from '../globalContext';
import instance from '../axiosConfig';
function DiscountSettings() {
  const [userData] = useState(() => {
    const cached = sessionStorage.getItem('userData');
    return cached ? JSON.parse(cached) : null;
  });
  const {organizationId} = useContext(GlobalContext);
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
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
        discountRate: formState.discountRate / 100
      };
      await instance.post(`/discount`, submissionData);
      navigate(-1);
    } catch (error) {
      setApiError(
        error.response?.data?.message ||
          "Failed to create discount. Please try again."
      );
      console.error("Error creating discount:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  const validateForm = () => {
    const newErrors = {};
    
    if (!formState.discountRate > 100) {
      newErrors.discountRate = "Discount rate cannot be greater than 100%.";
    }

    if (formState.discountRate < 1) {
      newErrors.discountRate = "Discount rate cannot be lesser than 1%.";
    }

    if(!formState.discountName) {
      newErrors.discountName = "Discount name cannot be empty!";
    }
    if(!formState.discountStart){
      newErrors.discountStart = "Discount Start Date cannot be empty!";
    }
    if(!formState.discountEnd){
      newErrors.discountEnd = "Discount End Date cannot be empty!";
    }

    if(formState.discountEnd < formState.discountStart){
      newErrors.discountEnd = "Discount End Date cannot be earlier than discount start!";
    }

    if (normalizeDate(formState.discountEnd) < normalizeDate(new Date())) {
      newErrors.discountEnd = "Discount End Date cannot be earlier than today's date!";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const normalizeDate = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };

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
          <form onSubmit={handleFormSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Discount Rate (%)
                </label>
                <input
                  onChange={handleInputChange}
                  value={formState.discountRate}
                  name="discountRate"
                  type="number"
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500  ${
                    errors.discountRate ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="0.00"
                />
                {errors.discountRate && (
                  <p className="text-red-500 text-sm">{errors.discountRate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Discount Name
                </label>
                <input
                  onChange={handleInputChange}
                  name="discountName"
                  value={formState.discountName}
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Input Discount Name"
                />
                  {errors.discountName && (
                  <p className="text-red-500 text-sm">{errors.discountName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Discount Start Date
                </label>
                <input
                  onChange={handleInputChange}
                  name="discountStart"
                  value={formState.discountStart}
                  type="date"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Input Discount Start"
                />
                 {errors.discountStart && (
                  <p className="text-red-500 text-sm">{errors.discountStart}</p>
                )}
              </div>

              {/* <div>
              <label className="block text-sm font-medium text-gray-700">
                Discount Type
              </label>
              <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
                <option value="both">Both</option>
              </select>
            </div> */}

              {/* <div>
              <label className="block text-sm font-medium text-gray-700">
                Discount Validity (Days)
              </label>
              <input
                type="number"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="30"
              />
            </div> */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Discount End Date
                </label>
                <input
                  onChange={handleInputChange}
                  name="discountEnd"
                  value={formState.discountEnd}
                  type="date"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Input Discount Name"
                />
                {errors.discountEnd && (
                  <p className="text-red-500 text-sm">{errors.discountEnd}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Discount Description
                </label>
                <input
                  onChange={handleInputChange}
                  name="description"
                  value={formState.description}
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Input Discount Description"
                />
              </div>
              {/* 
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Applicable Products
              </label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                multiple
                size="3"
              >
                <option value="all">All Products</option>
                <option value="batteries">Batteries Only</option>
                <option value="services">Services Only</option>
              </select>
            </div> */}

              <div className="md:col-span-2">
                <div className="flex justify-end mt-6 space-x-3">
                  <button
                    onClick={() => navigate("/settings")}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-[#38304C] border border-transparent rounded-md shadow-sm hover:bg-[#2A2338] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#38304C]"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default DiscountSettings;