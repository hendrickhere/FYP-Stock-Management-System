import React, { useState, useContext, useEffect, useRef } from "react";
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
import { 
  AlertCircle, 
  RefreshCcw, 
  WifiOff, 
  Search, 
  User2 
} from "lucide-react";
import Header from "./header";
import Sidebar from "./sidebar";

const AddAppointment = () => {
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
  const dropdownRef = useRef(null);
  const timeSlotDropdownRef = useRef(null);
  const technicianDropdownRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  const [formState, setFormState] = useState({
    selectedCustomer: null,
    customerData: null,
    showCustomerDropdown: false,
    showTechnicianDropdown: false,  
    selectedTechnician: null,       
    technicianData: null,
    technicianFetchError: false,
    showTimeSlotDropdown: false, 
    serviceType: "",
    appointmentDate: "",
    timeSlot: "",
    status: "scheduled"
  });

  const [errors, setErrors] = useState({});

  // Time slots 24 hour format
  const timeSlots = [
    "00:00", "00:30", "01:00", "01:30", "02:00", "02:30", "03:00", "03:30",
    "04:00", "04:30", "05:00", "05:30", "06:00", "06:30", "07:00", "07:30",
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
    "20:00", "20:30", "21:00", "21:30", "22:00", "22:30", "23:00", "23:30"
  ];

  const serviceTypes = [
    "Battery Replacement",
    "Battery Testing",
    "Jump Start Service",
    "Electrical System Check",
    "Emergency Service",
    "Maintenance Check",
    "Other"
  ];

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setFormState(prev => ({ ...prev, showCustomerDropdown: false }));
    }
    if (timeSlotDropdownRef.current && !timeSlotDropdownRef.current.contains(event.target)) {
      setFormState(prev => ({ ...prev, showTimeSlotDropdown: false }));
    }
    if (technicianDropdownRef.current && !technicianDropdownRef.current.contains(event.target)) {
      setFormState(prev => ({ ...prev, showTechnicianDropdown: false }));
    }
  };

  const handleTimeSlotClick = () => {
    setFormState(prev => ({
      ...prev,
      showTimeSlotDropdown: !prev.showTimeSlotDropdown
    }));
  };

  const handleTimeSlotSelect = (time) => {
    setFormState(prev => ({
      ...prev,
      timeSlot: time,
      showTimeSlotDropdown: false
    }));
  };

  const handleTechnicianSearch = async () => {
    if (formState.showTechnicianDropdown) {
      setFormState(prev => ({ ...prev, showTechnicianDropdown: false }));
      return;
    }

    setFormState(prev => ({ ...prev, technicianFetchError: false }));

    try {
      const response = await instance.get(`http://localhost:3002/api/user/${username}/staff`);
      if (response.data?.staff?.length === 0) {
        setFormState(prev => ({
          ...prev,
          technicianFetchError: 'no-technicians',
          showTechnicianDropdown: true
        }));
      } else {
        setFormState(prev => ({
          ...prev,
          technicianData: response.data,
          showTechnicianDropdown: true
        }));
      }
    } catch (error) {
      setFormState(prev => ({
        ...prev,
        technicianFetchError: 'fetch-error',
        showTechnicianDropdown: true
      }));
    }
  };

  const handleTechnicianSelect = (technician) => {
    setFormState(prev => ({
      ...prev,
      selectedTechnician: technician,
      showTechnicianDropdown: false
    }));
  };

  const handleCustomerSearch = async () => {
    if (formState.showCustomerDropdown) {
      setFormState(prev => ({ ...prev, showCustomerDropdown: false }));
      return;
    }

    try {
      const response = await instance.get(`http://localhost:3002/api/stakeholders/customers?username=${username}`);
      setFormState(prev => ({
        ...prev,
        customerData: response.data,
        showCustomerDropdown: true
      }));
    } catch (error) {
      setApiError("Failed to fetch customers. Please try again.");
    }
  };

  const handleCustomerSelect = (customer) => {
    setFormState(prev => ({
      ...prev,
      selectedCustomer: customer,
      showCustomerDropdown: false
    }));
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

  const validateForm = () => {
    const newErrors = {};
    
    if (!formState.selectedCustomer) {
      newErrors.customer = "Customer selection is required";
    }
    
    if (!formState.selectedCustomer) {
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
        username: username,
        customerUUID: formState.selectedCustomer.customer_uuid,
        serviceType: formState.serviceType,
        appointmentDate: formState.appointmentDate,
        timeSlot: formState.timeSlot,
        status: formState.status
      };

      await instance.post(
        `http://localhost:3002/api/appointment/add`,
        appointmentData
      );
      navigate(-1);
    } catch (error) {
      console.error(error);
      setApiError("Failed to create appointment. Please try again.");
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
          <h1 className="text-2xl font-bold pl-6">Schedule New Appointment</h1>
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
              <CardTitle>Appointment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Customer</label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    className={`w-full p-2 border rounded-md cursor-pointer ${
                      errors.customer ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Select Customer"
                    value={formState.selectedCustomer ? formState.selectedCustomer.customer_name : ""}
                    onClick={handleCustomerSearch}
                  />
                  {errors.customer && (
                    <p className="text-red-500 text-sm">{errors.customer}</p>
                  )}
                  {formState.showCustomerDropdown && (
                    <div className="absolute w-full z-10" ref={dropdownRef}>
                      <div className="mt-1 w-full bg-white border rounded-lg shadow-lg">
                        <ul className="py-1 max-h-60 overflow-auto">
                          {formState.customerData?.customers.map((customer) => (
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

              {/* <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Technician</label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    className={`w-full p-2 border rounded-md cursor-pointer ${
                      errors.technician ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Select Technician"
                    value={formState.selectedTechnician ? formState.selectedTechnician.staff_name : ""}
                    onClick={handleTechnicianSearch}
                  />
                  {errors.technician && (
                    <p className="text-red-500 text-sm">{errors.technician}</p>
                  )}
                {formState.showTechnicianDropdown && (
                  <div className="absolute w-full z-10" ref={technicianDropdownRef}>
                    <div className="mt-1 w-full bg-white border rounded-lg shadow-lg">
                      {formState.technicianFetchError ? (
                        <div className="p-4">
                          {formState.technicianFetchError === 'no-technicians' ? (
                            <div className="flex flex-col items-center justify-center text-center py-6">
                              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-3">
                                <AlertCircle className="w-8 h-8 text-yellow-500" />
                              </div>
                              <h3 className="text-sm font-medium text-gray-900 mb-1">No Technicians Available</h3>
                              <p className="text-sm text-gray-500">There are currently no technicians registered in the system.</p>
                              <button
                                type="button"
                                onClick={() => handleTechnicianSearch()}
                                className="mt-4 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
                              >
                                <RefreshCcw className="w-4 h-4" />
                                Try Again
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center text-center py-6">
                              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-3">
                                <WifiOff className="w-8 h-8 text-red-500" />
                              </div>
                              <h3 className="text-sm font-medium text-gray-900 mb-1">Connection Error</h3>
                              <p className="text-sm text-gray-500">Unable to fetch technician data. Please check your connection.</p>
                              <button
                                type="button"
                                onClick={() => handleTechnicianSearch()}
                                className="mt-4 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
                              >
                                <RefreshCcw className="w-4 h-4" />
                                Retry
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <div className="p-2 border-b">
                            <div className="relative">
                              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                              <input
                                type="text"
                                placeholder="Search technicians..."
                                className="w-full pl-9 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onChange={(e) => {
                                  // Add search functionality if needed
                                }}
                              />
                            </div>
                          </div>
                          <ul className="py-1 max-h-60 overflow-y-auto">
                            {formState.technicianData?.staff.map((technician) => (
                              <li
                                key={technician.staff_uuid}
                                className="px-4 py-3 hover:bg-gray-100 cursor-pointer transition-colors duration-150"
                                onClick={() => handleTechnicianSelect(technician)}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <User2 className="w-4 h-4 text-blue-600" />
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {technician.staff_name}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {technician.position}
                                    </div>
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                </div>
              </div> */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Service Type</label>
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
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <select
                    name="status"
                    value={formState.status}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-md"
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
                  <label className="text-sm font-medium text-gray-700">Appointment Date</label>
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
                  <label className="text-sm font-medium text-gray-700">Time Slot</label>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      className={`w-full p-2 border rounded-md cursor-pointer ${
                        errors.timeSlot ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Select Time Slot"
                      value={formState.timeSlot}
                      onClick={handleTimeSlotClick}
                    />
                    {errors.timeSlot && (
                      <p className="text-red-500 text-sm">{errors.timeSlot}</p>
                    )}
                    {formState.showTimeSlotDropdown && (
                      <div className="absolute w-full z-10" ref={timeSlotDropdownRef}>
                        <div className="mt-1 w-full bg-white border rounded-lg shadow-lg">
                          <ul className="py-1 max-h-60 overflow-y-auto">
                            {timeSlots.map((time) => (
                              <li
                                key={time}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                onClick={() => handleTimeSlotSelect(time)}
                              >
                                {time}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
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

export default AddAppointment;