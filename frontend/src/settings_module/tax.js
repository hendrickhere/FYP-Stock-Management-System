import React, {useState, useEffect, useContext} from 'react';
import { useNavigate } from 'react-router-dom';
import { IoReceipt } from "react-icons/io5";
import instance from '../axiosConfig';
import { GlobalContext } from '../globalContext';
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";
import TaxView from './view_tax';
function Tax() {
  const [userData] = useState(() => {
    const cached = sessionStorage.getItem('userData');
    return cached ? JSON.parse(cached) : null;
  });
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const { organizationId } = useContext(GlobalContext);
  const [formState, setFormState] = useState({
    taxName: "",
    taxRate: 0,
    description: "",
    organizationId: organizationId,
  });
  const validateForm = () => {
    const newErrors = {};
    
    if (!formState.taxRate > 100) {
      newErrors.taxRate = "Tax rate cannot be greater than 100%.";
    }

    if (formState.taxRate < 1) {
      newErrors.taxRate = "Tax rate cannot be lesser than 1%.";
    }

    if(!formState.taxName) {
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
  } 
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
      navigate(-1);
    } catch (error) {
      setApiError(
        error.response?.data?.message ||
          "Failed to create appointment. Please try again."
      );
      console.error("Error creating appointment:", error);
    } finally {
      setIsSubmitting(false);
    }
  }
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Only allow admin and manager roles
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
          <IoReceipt className="w-6 h-6 mr-2" />
          <h1 className="text-2xl font-bold">Tax Settings</h1>
        </div>
        {apiError && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{apiError}</AlertDescription>
              </Alert>
            )}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Tax Configuration</h2>
          <form onSubmit={handleFormSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Default Tax Rate (%)
                </label>
                <input
                  type="number"
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500  ${
                    errors.taxRate ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="0.00"
                  value={formState.taxRate}
                  name="taxRate"
                  onChange={handleFormChange}
                />{" "}
                {errors.taxRate && (
                  <p className="text-red-500 text-sm">{errors.taxRate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tax Name
                </label>
                <input
                  name="taxName"
                  type="text"
                  value={formState.taxName}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                    errors.taxName ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter tax registration number"
                  onChange={handleFormChange}
                />
                {errors.taxName && (
                  <p className="text-red-500 text-sm">{errors.taxName}</p>
                )}
              </div>

              {/* Additional tax settings */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <input
                  name="description"
                  value={formState.description}
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Enter tax registration number"
                  onChange={handleFormChange}
                />
              </div>

              {/* <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Tax Authority</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Enter tax authority name"
              />
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
                    disabled={isSubmitting}
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-[#38304C] border border-transparent rounded-md shadow-sm hover:bg-[#2A2338] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#38304C]"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
        <div className='mt-8'>
        <TaxView/>

        </div>
      </div>
    </div>
  );
}

export default Tax;