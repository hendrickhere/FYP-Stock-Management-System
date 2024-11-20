import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GlobalContext } from "../globalContext";
import instance from "../axiosConfig";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Alert, AlertDescription } from "../ui/alert";
import { AlertCircle } from "lucide-react";
import Header from "../header";
import Sidebar from "../sidebar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

const AddVendor = () => {
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
};

const MainContent = ({ isMobile }) => {
  const navigate = useNavigate();
  const { username } = useContext(GlobalContext);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const [formState, setFormState] = useState({
    vendorName: "",
    contactPerson: "",
    phoneNumber: "",
    address: "",
    activityStatus: "active",
    username: username
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formState.vendorName.trim()) {
      newErrors.vendorName = "Vendor name is required";
    } else if (formState.vendorName.length > 255) {
      newErrors.vendorName = "Name cannot exceed 255 characters";
    }
    
    if (!formState.contactPerson.trim()) {
      newErrors.contactPerson = "Contact person is required";
    } else if (formState.contactPerson.length > 255) {
      newErrors.contactPerson = "Contact person name cannot exceed 255 characters";
    }
    
    if (!formState.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    } else if (formState.phoneNumber.length > 255) {
      newErrors.phoneNumber = "Phone number cannot exceed 255 characters";
    }
    
    if (!formState.address.trim()) {
      newErrors.address = "Address is required";
    } else if (formState.address.length > 255) {
      newErrors.address = "Address cannot exceed 255 characters";
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
        `/stakeholders/vendors`,
        formState
      );
      navigate(-1);
    } catch (error) {
      setApiError("Failed to add vendor. Please try again.");
      console.error("Error adding vendor:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowCancelDialog(true);
  };

  return (
    <main className="flex-1">
      <div className={`h-[calc(100vh-4rem)] overflow-y-auto ${isMobile ? 'w-full' : 'ml-[13rem]'}`}>
        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent className="bg-white">
            <AlertDialogHeader>
              <AlertDialogTitle>Discard Changes</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to discard your changes? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => navigate(-1)}>
                Discard Changes
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="p-6">
          <div className="max-w-[1400px] mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-bold pl-6">Add New Vendor</h1>
            </div>

            {apiError && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{apiError}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-8 pb-24">
              <Card>
                <CardHeader>
                  <CardTitle>Vendor Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 required-field">
                      Vendor Name
                    </label>
                    <input
                      type="text"
                      name="vendorName"
                      value={formState.vendorName}
                      onChange={handleInputChange}
                      maxLength={255}
                      className={`w-full p-2 border rounded-md ${
                        errors.vendorName ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors.vendorName && (
                      <p className="text-red-500 text-sm">{errors.vendorName}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 required-field">
                        Contact Person
                      </label>
                      <input
                        type="text"
                        name="contactPerson"
                        value={formState.contactPerson}
                        onChange={handleInputChange}
                        maxLength={255}
                        className={`w-full p-2 border rounded-md ${
                          errors.contactPerson ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors.contactPerson && (
                        <p className="text-red-500 text-sm">{errors.contactPerson}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 required-field">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={formState.phoneNumber}
                        onChange={handleInputChange}
                        maxLength={255}
                        className={`w-full p-2 border rounded-md ${
                          errors.phoneNumber ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors.phoneNumber && (
                        <p className="text-red-500 text-sm">{errors.phoneNumber}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 required-field">
                      Address
                    </label>
                    <textarea
                      name="address"
                      value={formState.address}
                      onChange={handleInputChange}
                      maxLength={255}
                      rows={3}
                      className={`w-full p-2 border rounded-md ${
                        errors.address ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors.address && (
                      <p className="text-red-500 text-sm">{errors.address}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Activity Status
                    </label>
                    <select
                      name="activityStatus"
                      value={formState.activityStatus}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded-md border-gray-300"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </CardContent>
              </Card>
            </form>

            {/* Action Buttons */}
            <div 
              className="fixed bottom-0 right-0 bg-white border-t p-4 z-10"
              style={{ 
                left: isMobile ? '0' : '13rem'
              }}
            >
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
                  onClick={handleSubmit}
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
                  ) : (
                    "Save"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default AddVendor;