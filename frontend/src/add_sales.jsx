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
import { AlertCircle } from "lucide-react";
import Header from "./header";
import Sidebar from "./sidebar";
import ItemTable from "./addSalesInventoryTable";

const AddSales = () => {
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
  
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Form state
  const [formState, setFormState] = useState({
    customerData: null,
    selectedCustomer: null,
    showCustomer: false,
    salesOrderRef: "",
    orderDate: "",
    shipmentDate: "",
    paymentTerms: "",
    deliveryMethod: "",
    deliveryDate: "",
    items: [{}]
  });

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setFormState(prev => ({ ...prev, showCustomer: false }));
    }
  };

  const handleCustomerSearch = async () => {
    if (formState.showCustomer) {
      setFormState(prev => ({ ...prev, showCustomer: false }));
      return;
    }

    try {
      const response = await instance.get(`http://localhost:3002/api/stakeholders/customers?username=${username}`);
      setFormState(prev => ({
        ...prev,
        customerData: response.data,
        showCustomer: true
      }));
    } catch (error) {
      setApiError("Failed to fetch customers. Please try again.");
    }
  };

  const handleCustomerSelect = (customer) => {
    setFormState(prev => ({
      ...prev,
      selectedCustomer: customer,
      showCustomer: false
    }));
  };

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
    
    if (!formState.selectedCustomer) {
      newErrors.customer = "Customer selection is required";
    }
    
    if (!formState.orderDate) {
      newErrors.orderDate = "Order date is required";
    }
    
    if (!formState.shipmentDate) {
      newErrors.shipmentDate = "Shipment date is required";
    }
    
    if (!formState.paymentTerms) {
      newErrors.paymentTerms = "Payment terms are required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setIsSubmitting(true);
    setApiError(null);

    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    try {
      const salesData = {
        orderDateTime: formState.orderDate,
        expectedShipmentDate: formState.shipmentDate,
        paymentTerms: formState.paymentTerms,
        deliveryMethod: formState.deliveryMethod,
        customerUUID: formState.selectedCustomer.customer_uuid,
        itemsList: formState.items.map(item => ({
          uuid: item.product_uuid,
          quantity: item.quantity
        }))
      };

      await instance.post(`http://localhost:3002/api/user/${username}/salesOrder`, salesData);
      window.alert('Sales order created successfully!');
      navigate(-1);
    } catch (error) {
      setApiError("Failed to create sales order. Please try again.");
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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex-auto ml-52 overflow-y-auto pb-20 p-4 custom-scrollbar">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold pl-6">Add New Sales Order</h1>
        </div>

        {apiError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Information Card */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Customer Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      className={`w-full p-2 border rounded-md ${
                        errors.customer ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Select Customer"
                      value={formState.selectedCustomer ? formState.selectedCustomer.customer_name : ""}
                      onClick={handleCustomerSearch}
                    />
                    {errors.customer && (
                      <p className="text-red-500 text-sm">{errors.customer}</p>
                    )}
                    {formState.showCustomer && (
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

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Sales Order Reference</label>
                  <input
                    type="text"
                    name="salesOrderRef"
                    value={formState.salesOrderRef}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Order Date</label>
                  <input
                    type="date"
                    name="orderDate"
                    value={formState.orderDate}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded-md ${
                      errors.orderDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.orderDate && (
                    <p className="text-red-500 text-sm">{errors.orderDate}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Payment Terms</label>
                  <input
                    type="text"
                    name="paymentTerms"
                    value={formState.paymentTerms}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded-md ${
                      errors.paymentTerms ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.paymentTerms && (
                    <p className="text-red-500 text-sm">{errors.paymentTerms}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Shipping Information Card */}
            <Card>
              <CardHeader>
                <CardTitle>Shipping Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Expected Shipment Date</label>
                  <input
                    type="date"
                    name="shipmentDate"
                    value={formState.shipmentDate}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded-md ${
                      errors.shipmentDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.shipmentDate && (
                    <p className="text-red-500 text-sm">{errors.shipmentDate}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Delivery Date</label>
                  <input
                    type="date"
                    name="deliveryDate"
                    value={formState.deliveryDate}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Delivery Method</label>
                  <input
                    type="text"
                    name="deliveryMethod"
                    value={formState.deliveryMethod}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Shipping Address</label>
                  <textarea
                    name="shippingAddress"
                    value={formState.shippingAddress || (formState.selectedCustomer ? formState.selectedCustomer.shipping_address : '')}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-md h-24"
                    placeholder="Enter shipping address"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Items Table */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <ItemTable 
                items={formState.items} 
                setItems={(items) => setFormState(prev => ({ ...prev, items }))}
              />
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

export default AddSales;