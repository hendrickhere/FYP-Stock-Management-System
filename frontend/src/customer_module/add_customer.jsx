import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GlobalContext } from "../globalContext";
import instance from "../axiosConfig";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Alert, AlertDescription } from "../ui/alert";
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
import { AlertCircle } from "lucide-react";
import Header from "../header";
import Sidebar from "../sidebar";

const AddCustomer = () => {
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
  const [isChecked, setIsChecked] = useState(true);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  
  const handleCheckboxChange = () => {
    setIsChecked(!isChecked);
  };

  const [formState, setFormState] = useState({
    customerName: "",        
    customerEmail: "",       
    customerDesignation: "Mr", 
    customerContact: "",     
    customerCompany: "",     
    billingAddress: "",     
    shippingAddress: ""       
  });

  useEffect(() => {
    if (isChecked) {
      setFormState((prevState) => ({
        ...prevState,
        billingAddress: prevState.shippingAddress, 
      }));
    }
  }, [isChecked]);

  const [errors, setErrors] = useState({});

  const handleCancel = () => {
    setShowCancelDialog(true); 
  };

  const handleConfirmCancel = () => {
    setShowCancelDialog(false);
    navigate(-1);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formState.customerName.trim()) {
      newErrors.customerName = "Customer name is required";
    } else if (formState.customerName.length > 255) {
      newErrors.customerName = "Name cannot exceed 255 characters";
    }

    if (!formState.customerEmail.trim()) {
      newErrors.customerEmail = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formState.customerEmail)) {
      newErrors.customerEmail = "Please enter a valid email address";
    } else if (formState.customerEmail.length > 255) {
      newErrors.customerEmail = "Email cannot exceed 255 characters";
    }

    if (!formState.customerContact.trim()) {
      newErrors.customerContact = "Contact number is required";
    } else if (formState.customerContact.length > 255) {
      newErrors.customerContact = "Contact number cannot exceed 255 characters";
    }

    if (!formState.customerCompany.trim()) {
      newErrors.customerCompany = "Company name is required";
    } else if (formState.customerCompany.length > 255) {
      newErrors.customerCompany = "Company name cannot exceed 255 characters";
    }

    if (!formState.shippingAddress.trim()) {
      newErrors.shippingAddress = "Shipping address is required";
    } else if (formState.shippingAddress.length > 255) {
      newErrors.shippingAddress = "Shipping address cannot exceed 255 characters";
    }

    if (!isChecked && !formState.billingAddress.trim()) {
      newErrors.billingAddress = "Billing address is required";
    } else if (!isChecked && formState.billingAddress.length > 255) {
      newErrors.billingAddress = "Billing address cannot exceed 255 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
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
      const response = await instance.post(
        `/stakeholders/addCustomer?username=${username}`, 
        {
          customerName: formState.customerName,
          customerEmail: formState.customerEmail,
          customerDesignation: formState.customerDesignation,
          customerContact: formState.customerContact,
          customerCompany: formState.customerCompany,
          billingAddress: isChecked ? formState.shippingAddress : formState.billingAddress,
          shippingAddress: formState.shippingAddress
        }
      );

      if (response.data.customer) {
        navigate(-1);
      }
    } catch (error) {
      setApiError(error.response?.data?.message || "Failed to add customer. Please try again.");
      console.error("Error adding customer:", error);
    } finally {
      setIsSubmitting(false);
    }
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
              <AlertDialogAction onClick={handleConfirmCancel}>
                Discard Changes
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <div className="p-6">
          <div className="max-w-[1400px] mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-bold">Add New Customer</h1>
            </div>

            {apiError && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{apiError}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-8 pb-24">
              <Card>
            <CardHeader className="pb-2"> 
              <CardTitle>Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 required-field">
                      Customer Name
                    </label>
                    <input
                      type="text"
                      name="customerName"
                      value={formState.customerName}
                      onChange={handleInputChange}
                      maxLength={255}
                      className={`w-full p-2 border rounded-md ${
                        errors.customerName ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors.customerName && (
                      <p className="text-red-500 text-sm">{errors.customerName}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 required-field">
                        Email
                      </label>
                      <input
                        type="email"
                        name="customerEmail"
                        value={formState.customerEmail}
                        onChange={handleInputChange}
                        maxLength={255}
                        className={`w-full p-2 border rounded-md ${
                          errors.customerEmail ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors.customerEmail && (
                        <p className="text-red-500 text-sm">{errors.customerEmail}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Designation
                      </label>
                      <select
                        name="customerDesignation"
                        value={formState.customerDesignation}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded-md border-gray-300"
                      >
                        <option value="Mr">Mr</option>
                        <option value="Mrs">Mrs</option>
                        <option value="Ms">Ms</option>
                        <option value="Dr">Dr</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 required-field">
                        Contact Number
                      </label>
                      <input
                        type="tel"
                        name="customerContact"
                        value={formState.customerContact}
                        onChange={handleInputChange}
                        maxLength={255}
                        className={`w-full p-2 border rounded-md ${
                          errors.customerContact ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors.customerContact && (
                        <p className="text-red-500 text-sm">{errors.customerContact}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 required-field">
                        Company Name
                      </label>
                      <input
                        type="text"
                        name="customerCompany"
                        value={formState.customerCompany}
                        onChange={handleInputChange}
                        maxLength={255}
                        className={`w-full p-2 border rounded-md ${
                          errors.customerCompany ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors.customerCompany && (
                        <p className="text-red-500 text-sm">{errors.customerCompany}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-medium text-gray-700 required-field">
                      Shipping Address
                    </label>
                    <textarea
                      name="shippingAddress"
                      value={formState.shippingAddress}
                      onChange={handleInputChange}
                      rows={3}
                      maxLength={255}
                      className={`w-full p-2 border rounded-md ${
                        errors.shippingAddress ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors.shippingAddress && (
                      <p className="text-red-500 text-sm">{errors.shippingAddress}</p>
                    )}
                    <div className="flex items-center gap-2 mt-4">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={handleCheckboxChange}
                        className="rounded border-gray-300 w-4 h-4"
                      />
                      <span className="text-sm text-gray-700">
                        Use shipping address as billing address
                      </span>
                    </div>
                  </div>

                  {!isChecked && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 required-field">
                        Billing Address
                      </label>
                      <textarea
                        name="billingAddress"
                        value={formState.billingAddress}
                        onChange={handleInputChange}
                        rows={3}
                        maxLength={255}
                        className={`w-full p-2 border rounded-md ${
                          errors.billingAddress ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors.billingAddress && (
                        <p className="text-red-500 text-sm">{errors.billingAddress}</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </form>

            {/* Action Buttons */}
            <div className="fixed bottom-0 right-0 bg-white border-t p-4 z-10"
                 style={{ 
                   left: isMobile ? '0' : '13rem'
                 }}>
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

export default AddCustomer;