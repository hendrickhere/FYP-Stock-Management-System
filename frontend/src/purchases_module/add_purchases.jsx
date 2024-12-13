import React, { useState, useContext, useEffect, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import { GlobalContext } from "../globalContext";
import instance from "../axiosConfig";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "../ui/card";
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
import ItemTable from "./addPurchasesInventoryTable";

const AddPurchases = () => {
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
  const [apiError, setApiError] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const dropdownRef = useRef(null);
  
  const [formState, setFormState] = useState({
    vendorData: null,
    selectedVendor: null,
    showVendor: false,
    purchaseOrderRef: "",
    orderDate: "",
    paymentTerms: "",
    deliveryMethod: "",
    deliveredDate: "", // This will now trigger status update to 'delivered' if set
    items: [{}],
    orderStatus: 'pending' 
  });

  const handleCancel = () => {
    setShowCancelDialog(true);
  };

  const handleConfirmCancel = () => {
    setShowCancelDialog(false);
    navigate(-1);
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

    // Validate delivered date is not before order date
    if (formState.deliveredDate && formState.orderDate) {
      const orderDate = new Date(formState.orderDate);
      const deliveredDate = new Date(formState.deliveredDate);
      if (deliveredDate < orderDate) {
        newErrors.deliveredDate = "Delivered date cannot be before order date";
      }
    }

    // Validate items
    if (!formState.items.length || !formState.items.some(item => item.product_uuid)) {
      newErrors.items = "At least one item must be added to the purchase order";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateTotalAmount = () => {
    let totalAmount = 0;
    formState.items.forEach((item) => {
      if (item.quantity && item.cost) {
        totalAmount += (parseFloat(item.cost) * parseInt(item.quantity, 10));
      }
    });
    console.log('Calculated total amount:', totalAmount); // Debug log
    return totalAmount;
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
      const totalAmount = calculateTotalAmount();
      
      // Add validation for total amount
      if (!totalAmount || totalAmount <= 0) {
        throw new Error('Total amount must be greater than 0');
      }

      const purchaseData = {
        orderDate: formState.orderDate,
        paymentTerms: formState.paymentTerms,
        deliveredDate: formState.deliveredDate || null,
        totalAmount: totalAmount, // Make sure this is set
        total_amount: totalAmount, // Add this as well to match backend expectation
        deliveryMethod: formState.deliveryMethod,
        vendorSn: formState.selectedVendor.vendor_sn,
        username: username,
        orderStatus: formState.deliveredDate ? 'delivered' : 'pending',
        itemsList: formState.items.map(item => ({
          uuid: item.product_uuid,
          quantity: parseInt(item.quantity, 10),
          cost: parseFloat(item.cost)
        }))
      };

      console.log('Submitting purchase data:', purchaseData); // Debug log

      const endpoint = formState.deliveredDate 
        ? `/purchases/add-delivered`
        : `/purchases/add`;

      const response = await instance.post(endpoint, purchaseData);
      console.log('Purchase creation response:', response.data);
      
      navigate(-1);
    } catch (error) {
      console.error('Purchase order creation error:', error.response || error);
      setApiError(
        error.response?.data?.message || 
        error.message ||
        "Failed to create purchase order. Please check your input and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex-1">
      <div className={`h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar ${isMobile ? 'w-full' : 'ml-[13rem]'}`}>
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
              <h1 className="text-2xl font-bold pl-6">Add New Purchase Order</h1>
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
                      <label className="text-sm font-medium text-gray-700">
                        Delivered Date
                      </label>
                      <div className="space-y-1">
                        <input
                          type="date"
                          name="deliveredDate"
                          value={formState.deliveredDate}
                          onChange={handleInputChange}
                          className={`w-full p-2 border rounded-md ${
                            errors.deliveredDate ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        <p className="text-sm text-gray-500">
                          Set this only if items have been received. This will automatically update inventory stock.
                        </p>
                        {errors.deliveredDate && (
                          <p className="text-red-500 text-sm">{errors.deliveredDate}</p>
                        )}
                      </div>
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
                  ) : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default AddPurchases;           
              
              
              
              
