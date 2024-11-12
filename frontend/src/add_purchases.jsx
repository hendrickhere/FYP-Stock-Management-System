import React, { useState, useContext, useEffect, useRef } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
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
import DragDropImageUploader from "./dragDropImageUploader";
import Header from "./header";
import Sidebar from "./sidebar";
import ItemTable from "./addSalesInventoryTable";


const AddPurchases = () => {
    return (
    <div className="flex flex-col h-screen w-full overflow-hidden">
      <Header />
      <div className="flex flex-row flex-grow overflow-hidden">
        <Sidebar />
        <MainContent />
      </div>
    </div>
  );
}

const MainContent = () => {
  const navigate = useNavigate();
  const { username } = useContext(GlobalContext);
  const [apiError, setApiError] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState({
    vendorData: null,
    selectedVendor: null,
    showVendor: false,
    purchaseOrderRef: "",
    orderDate: "",
    paymentTerms: "",
    deliveryMethod: "",
    deliveredDate: "",
    items: [{}]
  });

  const handleCancel = () => {
    const shouldExit = window.confirm("Are you sure you want to discard changes?");
    if (shouldExit) {
      navigate(-1);
    }
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

  const dropdownRef = useRef(null);
  const handleVendorSelect = (vendor) => {
    setFormState(prev => ({
      ...prev,
      selectedVendor: vendor,
      showVendor: false
    }));
  };
  const handleVendorSearch = async () => {
    if (formState.showVendor) {
      setFormState(prev => ({ ...prev, showVendor: false }));
      return;
    }

    const handleCancel = () => {
      const shouldExit = window.confirm("Are you sure you want to discard changes?");
      if (shouldExit) {
        navigate(-1);
      }
    };

    try {
      const response = await instance.get(`http://localhost:3002/api/stakeholders/vendors?username=${username}`);
      setFormState(prev => ({
        ...prev,
        vendorData: response.data,
        showVendor: true
      }));
    } catch (error) {
      setApiError("Failed to fetch Vendor. Please try again.");
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formState.selectedVendor) {
      newErrors.vendors = "Vendor selection is required";
    }
    
    if (!formState.orderDate) {
      newErrors.orderDate = "Order date is required";
    }

    if (!formState.paymentTerms) {
      newErrors.paymentTerms = "Payment terms are required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateTotalAmount = () => {
    var totalAmount = 0;
    formState.items.map((item) => {
      totalAmount += item.price * item.quantity;
    });
    return totalAmount;
  }

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setIsSubmitting(true);
    setApiError(null);

    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    var totalPurchase = calculateTotalAmount();
    try {
      const vendorData = {
        orderDate: formState.orderDate,
        paymentTerms: formState.paymentTerms,
        deliveredDate: formState.deliveredDate,
        totalAmount: totalPurchase,
        deliveryMethod: formState.deliveryMethod,
        vendorSn: formState.selectedVendor.vendor_sn,
        username: username,
        itemsList: formState.items.map(item => ({
          uuid: item.product_uuid,
          quantity: item.quantity
        }))
      };

      await instance.post(`http://localhost:3002/api/purchases/add`, vendorData);
      window.alert('Purchase order created successfully!');
      navigate(-1);
    } catch (error) {
      setApiError("Failed to create purchase order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <div className="flex-auto lg:ml-36 ml-0 overflow-y-auto pb-20 p-4 custom-scrollbar">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold pl-6">Add New Purchase Order</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <Card>
              <CardHeader>
                <CardTitle>Vendor Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Vendor Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      className={`w-full p-2 border rounded-md ${
                        errors.vendor ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Select Vendor"
                      value={formState.selectedVendor ? formState.selectedVendor.vendor_name : ""}
                      onClick={handleVendorSearch}
                    />
                    {errors.vendor && (
                      <p className="text-red-500 text-sm">{errors.vendor}</p>
                    )}
                    {formState.showVendor && (
                      <div className="absolute w-full z-10" ref={dropdownRef}>
                        <div className="mt-1 w-full bg-white border rounded-lg shadow-lg">
                          <ul className="py-1 max-h-60 overflow-auto">
                            {formState.vendorData?.vendors.map((vendor) => (
                              <li
                                key={vendor.vendor_id}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                onClick={() => handleVendorSelect(vendor)}
                              >
                                {vendor.vendor_name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Purchase Order Reference</label>
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

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Delivered Date (leave empty if not received)</label>
                  <input
                    type="date"
                    name="deliveredDate"
                    value={formState.deliveredDate}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded-md ${
                      errors.deliveredDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.deliveredDate && (
                    <p className="text-red-500 text-sm">{errors.deliveredDate}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Delivery Method</label>
                  <input
                    type="text"
                    name="deliveryMethod"
                    value={formState.deliveryMethod}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded-md ${
                      errors.deliveryMethod ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.deliveryMethod && (
                    <p className="text-red-500 text-sm">{errors.deliveryMethod}</p>
                  )}
                </div>
              </CardContent>
            </Card>

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
          </div>
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
}

export default AddPurchases;