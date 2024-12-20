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

const AddAppointment = () => {
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
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [customerData, setCustomerData] = useState(null);

  const serviceTypes = [
    "Battery Replacement",
    "Battery Testing",
    "Jump Start Service",
    "Electrical System Check",
    "Emergency Service",
    "Maintenance Check",
    "Other"
  ];

  const [formState, setFormState] = useState({
    serviceType: "",
    appointmentDate: "",
    timeSlot: "",
    status: "scheduled"
  });

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
    
    if (!selectedCustomer) {
      newErrors.customer = "Customer selection is required";
    }

    if (!formState.serviceType) {
      newErrors.serviceType = "Service type is required";
    }

    if (!formState.appointmentDate) {
      newErrors.appointmentDate = "Appointment date is required";
    }

    if (!formState.timeSlot) {
      newErrors.timeSlot = "Time slot is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCustomerSearch = async () => {
    try {
      const response = await instance.get(`/stakeholders/customers?username=${username}`);
      setCustomerData(response.data);
      setShowCustomerDropdown(true);
    } catch (error) {
      setApiError("Failed to fetch customers. Please try again.");
    }
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setShowCustomerDropdown(false);
    if (errors.customer) {
      setErrors(prev => ({ ...prev, customer: undefined }));
    }
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
      const appointmentData = {
        username,
        customerUUID: selectedCustomer.customer_uuid,
        serviceType: formState.serviceType,
        appointmentDate: formState.appointmentDate,
        timeSlot: formState.timeSlot,
        status: formState.status
      };

      await instance.post('/appointment/add', appointmentData);
      navigate(-1);
    } catch (error) {
      setApiError(error.response?.data?.message || "Failed to create appointment. Please try again.");
      console.error("Error creating appointment:", error);
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
              <h1 className="text-2xl font-bold pl-6">Schedule New Appointment</h1>
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
                  <CardTitle>Appointment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 required-field">
                      Customer
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        className={`w-full p-2 border rounded-md cursor-pointer ${
                          errors.customer ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Select Customer"
                        value={selectedCustomer ? selectedCustomer.customer_name : ""}
                        onClick={handleCustomerSearch}
                      />
                      {errors.customer && (
                        <p className="text-red-500 text-sm">{errors.customer}</p>
                      )}
                      {showCustomerDropdown && customerData && (
                        <div className="absolute w-full z-10">
                          <div className="mt-1 w-full bg-white border rounded-lg shadow-lg">
                            <ul className="py-1 max-h-60 overflow-auto">
                              {customerData.customers.map((customer) => (
                                <li
                                  key={customer.customer_uuid}
                                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                  onClick={() => handleCustomerSelect(customer)}
                                >
                                  {customer.customer_name}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 required-field">
                        Service Type
                      </label>
                      <select
                        name="serviceType"
                        value={formState.serviceType}
                        onChange={handleInputChange}
                        className={`w-full p-2 border rounded-md ${
                          errors.serviceType ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select Service Type</option>
                        {serviceTypes.map((type) => (
                          <option key={type} value={type.toLowerCase()}>
                            {type}
                          </option>
                        ))}
                      </select>
                      {errors.serviceType && (
                        <p className="text-red-500 text-sm">{errors.serviceType}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Status
                      </label>
                      <select
                        name="status"
                        value={formState.status}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded-md border-gray-300"
                      >
                        <option value="scheduled">Scheduled</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="noShow">No Show</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 required-field">
                        Appointment Date
                      </label>
                      <input
                        type="date"
                        name="appointmentDate"
                        value={formState.appointmentDate}
                        onChange={handleInputChange}
                        min={new Date().toISOString().split('T')[0]}
                        className={`w-full p-2 border rounded-md ${
                          errors.appointmentDate ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.appointmentDate && (
                        <p className="text-red-500 text-sm">{errors.appointmentDate}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 required-field">
                        Time
                      </label>
                      <input
                        type="time"
                        name="timeSlot"
                        value={formState.timeSlot}
                        onChange={handleInputChange}
                        className={`w-full p-2 border rounded-md ${
                          errors.timeSlot ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.timeSlot && (
                        <p className="text-red-500 text-sm">{errors.timeSlot}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </form>

            {/* Action Buttons */}
            <div className="fixed bottom-0 right-0 bg-white border-t p-4 z-10"
                 style={{ 
                   left: isMobile ? '0' : '13rem',
                   width: 'auto'
                 }}>
              <div className="w-full flex justify-end gap-4 pr-4">
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

export default AddAppointment;