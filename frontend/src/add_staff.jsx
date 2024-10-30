import React, { useState, useContext } from "react";
import { useNavigate } from 'react-router-dom';
import { GlobalContext } from "./globalContext";
import instance from "./axiosConfig";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { AlertCircle } from "lucide-react";
import Header from "./header";
import Sidebar from "./sidebar";

const AddStaff = () => {
  return (
    <div className="flex flex-col h-screen w-full overflow-hidden">
      <Header />
      <div className="flex flex-row flex-grow overflow-hidden">
        <Sidebar />
        <MainContent />
      </div>
    </div>
  );
};

const MainContent = () => {
  const navigate = useNavigate();
  const { username } = useContext(GlobalContext);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  const [formState, setFormState] = useState({
    staffName: "",
    position: "",
    phoneNumber: "",
    address: "",
    hireDate: new Date().toISOString().split('T')[0], // Today's date as default
    status: "active" // Default to active
  });

  const [errors, setErrors] = useState({});

  const positions = [
    "Manager",
    "Sales Representative",
    "Inventory Specialist",
    "Customer Service",
    "Administrative Staff",
    "Warehouse Staff",
    "Other"
  ];

  const validateForm = () => {
    const newErrors = {};
    
    if (!formState.staffName.trim()) {
      newErrors.staffName = "Staff name is required";
    }
    
    if (!formState.position) {
      newErrors.position = "Position is required";
    }
    
    if (!formState.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    }
    
    if (!formState.address.trim()) {
      newErrors.address = "Address is required";
    }

    if (!formState.hireDate) {
      newErrors.hireDate = "Hire date is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setApiError(null);

    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    try {
      await instance.post(
        `http://localhost:3002/api/user/${username}/staff`,
        formState
      );
      navigate(-1);
    } catch (error) {
      setApiError("Failed to add staff member. Please try again.");
      console.error("Error adding staff:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    const shouldExit = window.confirm("Are you sure you want to discard changes?");
    if (shouldExit) {
      navigate(-1);
    }
  };

  return (
    <div className="flex-auto ml-52 overflow-y-auto pb-20 p-4 custom-scrollbar">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold pl-6">Add New Staff</h1>
        </div>

        {apiError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Staff Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Staff Name</label>
                <input
                  type="text"
                  name="staffName"
                  value={formState.staffName}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded-md ${
                    errors.staffName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.staffName && (
                  <p className="text-red-500 text-sm">{errors.staffName}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Position</label>
                  <select
                    name="position"
                    value={formState.position}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded-md ${
                      errors.position ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Position</option>
                    {positions.map((pos) => (
                      <option key={pos} value={pos.toLowerCase()}>
                        {pos}
                      </option>
                    ))}
                  </select>
                  {errors.position && (
                    <p className="text-red-500 text-sm">{errors.position}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Phone Number</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formState.phoneNumber}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded-md ${
                      errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.phoneNumber && (
                    <p className="text-red-500 text-sm">{errors.phoneNumber}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Address</label>
                <textarea
                  name="address"
                  value={formState.address}
                  onChange={handleInputChange}
                  rows={3}
                  className={`w-full p-2 border rounded-md ${
                    errors.address ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.address && (
                  <p className="text-red-500 text-sm">{errors.address}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Hire Date</label>
                  <input
                    type="date"
                    name="hireDate"
                    value={formState.hireDate}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded-md ${
                      errors.hireDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.hireDate && (
                    <p className="text-red-500 text-sm">{errors.hireDate}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <select
                    name="status"
                    value={formState.status}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="active">Active</option>
                    <option value="onLeave">On Leave</option>
                    <option value="terminated">Terminated</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="fixed bottom-0 left-52 right-0 bg-white border-t p-4 flex justify-end space-x-4">
            <div className="max-w-[1400px] mx-auto w-full flex justify-end space-x-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:opacity-50 relative"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="opacity-0">Save</span>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  </>
                ) : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStaff;