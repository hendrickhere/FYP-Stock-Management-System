import React, { useState, useContext, useEffect, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import { GlobalContext } from "../globalContext";
import instance from "../axiosConfig";
import MultiTaxSelection from './tax_section';
import toast, { Toaster } from 'react-hot-toast';
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "../ui/card";
import { Alert, AlertDescription } from "../ui/alert";
import { AlertCircle } from "lucide-react";
import Header from "../header";
import Sidebar from "../sidebar";
import ItemTable from "./addSalesInventoryTable";
import SalesSummary from "./sales_summary";
import MultiDiscountSelection from "./discount_section";
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

const AddSales = () => {
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
  const dropdownRef = useRef(null);
  const {organizationId} = useContext(GlobalContext);

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [requiresShipping, setRequiresShipping] = useState(false);
  const [selectedTaxes, setSelectedTaxes] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [isTaxLoading, setIsTaxLoading] = useState(false);
  const [taxError, setTaxError] = useState(null);
  const [selectedDiscount, setSelectedDiscounts] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [isDiscountLoading, setIsDiscountLoading] = useState(false);
  const [discountError, setDiscountError] = useState(null);
  const [tempPaymentInfo, setTempPaymentInfo] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

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
    cost: 50, 
    items: [{}]
  });

  useEffect(() => {
    fetchDiscounts();
    fetchTaxes();
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchDiscounts = async () => {
    try {
      setIsDiscountLoading(true);
      if (!organizationId) {
        throw new Error('Organization ID is missing');
      }
      const response = await instance.get(`/discounts?organizationId=${organizationId}&includeExpire=${0}`);
      setDiscounts(response.data.discounts);
    } catch (err) {
      console.error('Fetch discounts error:', err);
      setDiscountError("Failed to load discount rates");
    } finally {
      setIsDiscountLoading(false);
    }
  };

  const fetchTaxes = async () => {
    try {
      if (!organizationId) {
        throw new Error('Organization ID is missing');
      }
      const response = await instance.get(`/taxes?orgId=${organizationId}`);
      setTaxes(response.data.data);
      setIsTaxLoading(false);
    } catch (err) {
      console.error('Fetch taxes error:', err);
      setTaxError('Failed to load tax rates');
      setIsTaxLoading(false);
    }
  };

  const handleDiscountChange = async (discount) => {
    setSelectedDiscounts(prev => {
      const exists = prev.find(d => d.discount_id === discount.discount_id);
      if (exists) {
        return prev.filter(d => d.discount_id !== discount.discount_id);
      }
      return [...prev, discount];
    });
  };

  const handleTaxChange = async (tax) => {
    setSelectedTaxes(prev => {
      const exists = prev.find(t => t.tax_id === tax.tax_id);
      if (exists) {
        return prev.filter(t => t.tax_id !== tax.tax_id);
      }
      return [...prev, tax];
    });
  }

  useEffect(() => {
    fetchPrice(selectedDiscount, formState.items, selectedTaxes);
  }, [selectedDiscount, selectedTaxes, formState.items])

  const removeTax = async (taxId) => {
    setSelectedTaxes(prev => prev.filter(tax => tax.tax_id !== taxId));
  }

  const fetchPrice = async (discountIds, itemList, taxIds) => {
    try {
      const reqBody = {
        itemLists: itemList.map((item) => ({
          product_id: item.product_uuid,
          quantity: item.quantity,
        })),
        discountIds: discountIds.length > 0 ? discountIds.map((discount) => discount.discount_id) : undefined,
        taxIds: taxIds.length > 0 ? taxIds.map((tax) => tax.tax_id) : undefined,
        organization_id: organizationId
      };
      const response = await instance.post('/sales/taxAndDiscount', reqBody);
      if(response) {
        setTempPaymentInfo(response.data.data);
      }
    } catch (err) {
      console.error('Fetch price error:', err);
    }
  };

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
      const response = await instance.get(`/stakeholders/customers?username=${username}`);
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
        toast.error('Please select a customer');
        newErrors.customer = "Customer selection is required";
    }
    
    if (!formState.orderDate) {
        newErrors.orderDate = "Order date is required";
    }
    
    if (requiresShipping && !formState.shipmentDate) {
        newErrors.shipmentDate = "Shipment date is required";
    }
    
    if (!formState.paymentTerms) {
        newErrors.paymentTerms = "Payment terms are required";
    }

    // Add serial number validation
    const validItems = formState.items.filter(
      (item) => item.product_uuid && item.quantity && item.quantity > 0
    );

    // Check if all items have correct number of serial numbers
    const serialNumberError = validItems.some((item, index) => {
      const serialCount = item.serialNumbers?.length || 0;
      if (serialCount !== item.quantity) {
        toast.error(`Please add ${item.quantity} serial numbers for ${item.product_name}`);
        return true;
      }
      return false;
    });

    if (serialNumberError) {
      newErrors.serialNumbers = "All items must have matching serial numbers";
    }

    if (!validItems.length) {
      toast.error('Please add at least one valid item to the order');
      newErrors.items = "Please add at least one valid item to the order";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
};

  const handleSubmit = async (e) => {
    e?.preventDefault();

    if (!validateForm()) {
      // Show validation error toast
      toast.error('Please fill in all required fields correctly');
      return;
    }

    const validItems = formState.items.filter(
      (item) => item.product_uuid && item.quantity && item.quantity > 0
    );

    try {
      // Get current date and time in ISO format
      const currentDateTime = new Date().toISOString();

      const salesData = {
        // Use current date/time instead of just the date
        orderDateTime: currentDateTime,
        expectedShipmentDate: requiresShipping
          ? formState.shipmentDate
            ? new Date(formState.shipmentDate).toISOString()
            : null
          : null,
        paymentTerms: formState.paymentTerms,
        deliveryMethod: requiresShipping ? formState.deliveryMethod : "N/A",
        shippingAddress: requiresShipping ? formState.shippingAddress : "N/A",
        customerUUID: formState.selectedCustomer.customer_uuid,
        itemsList: validItems.map((item) => ({
          uuid: item.product_uuid,
          quantity: parseInt(item.quantity),
          price: parseFloat(item.price),
          serialNumbers: item.serialNumbers || [],
        })),
        discounts:
          selectedDiscount.length > 0
            ? selectedDiscount.map((discount, index) => ({
                discount_id: discount.discount_id,
                discount_rate: discount.discount_rate,
                discount_amount: tempPaymentInfo.discounts.find(d => d.discount_id === discount.discount_id)?.discount_amount,
              }))
            : null,
        taxes:
          selectedTaxes.length > 0
            ? selectedTaxes.map((tax) => ({
                tax_id: tax.tax_id,
                tax_rate: tax.tax_rate,
                tax_amount: tempPaymentInfo.taxes.find(t => t.tax_id === tax.tax_id)?.tax_amount,
              }))
            : null,
        subtotal: tempPaymentInfo?.subtotal ?? 0,
        grandtotal: tempPaymentInfo?.grandtotal ?? 0,
        totalTax: tempPaymentInfo.totalTaxAmount ?? 0, 
        discountAmount: tempPaymentInfo.totalDiscountAmount ?? 0,
      };

      console.log("Submitting sales data:", salesData); // Debug log

      const response = await instance.post(
        `/api/sales/${username}/salesOrder`,
        salesData
      );

      if (response.data) {
        // Show success toast
        toast.success('Sales order created successfully!', {
          duration: 3000,
          position: 'bottom-right',
        });
        navigate(-1);
      }
    } catch (error) {
      console.error("Error details:", error.response?.data);
      
      // Show specific error messages based on the error type
      if (error.response?.status === 400) {
        toast.error(error.response.data.message || 'Invalid sales order data', {
          duration: 4000,
          position: 'bottom-right',
        });
      } else if (error.response?.status === 401) {
        toast.error('Unauthorized access. Please log in again.', {
          duration: 4000,
          position: 'bottom-right',
        });
      } else if (error.response?.status === 403) {
        toast.error('You do not have permission to create sales orders.', {
          duration: 4000,
          position: 'bottom-right',
        });
      } else {
        toast.error('Failed to create sales order. Please try again.', {
          duration: 4000,
          position: 'bottom-right',
        });
      }
      
      setApiError(error.response?.data?.message || "Failed to create sales order");
    }
};

  const handleCancel = () => {
    setShowCancelDialog(true);
  };

  const handleConfirmCancel = () => {
    setShowCancelDialog(false);
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <main className="flex-1">
      <div
        className={`h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar min-w-[320px] ${
          isMobile ? "w-full" : "ml-[13rem]"
        }`}
      >

      <Toaster position="bottom-right" />
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
          <div className="w-full">
            <div className="mb-6">
              <h1 className="text-2xl font-bold pl-6">Add New Sales Order</h1>
            </div>

            {apiError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{apiError}</AlertDescription>
              </Alert>
            )}

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6 pb-24">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
            {/* Customer Information Card */}
            <Card className="w-full min-w-0">
              <CardHeader className="pb-2">
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Customer Name
                  </label>
                  <div className="relative mt-1">
                    <input
                      type="text"
                      readOnly
                      className={`w-full p-2 border rounded-md ${
                        errors.customer ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Select Customer"
                      value={
                        formState.selectedCustomer
                          ? formState.selectedCustomer.customer_name
                          : ""
                      }
                      onClick={handleCustomerSearch}
                    />
                    {errors.customer && (
                      <p className="text-red-500 text-sm">{errors.customer}</p>
                    )}
                      {/* Customer Dropdown */}
                      {formState.showCustomer && (
                        <div className="absolute w-full z-10" ref={dropdownRef}>
                          <div className="mt-1 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
                            {formState.customerData?.customers.map((customer) => (
                              <button
                                key={customer.customer_uuid}
                                type="button"
                                className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                                onClick={() => handleCustomerSelect(customer)}
                              >
                                <div className="font-medium">{customer.customer_name}</div>
                                <div className="text-sm text-gray-500">{customer.customer_email}</div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Sales Order Reference
                  </label>
                  <input
                    type="text"
                    name="salesOrderRef"
                    value={formState.salesOrderRef}
                    onChange={handleInputChange}
                    className="w-full min-w-0 p-2 border rounded-md"
                  />
                </div>
              </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Order Date
                  </label>
                  <input
                    type="date"
                    name="orderDate"
                    value={formState.orderDate}
                    onChange={handleInputChange}
                    className={`mt-1 w-full p-2 border rounded-md ${
                      errors.orderDate ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.orderDate && (
                    <p className="text-red-500 text-sm">{errors.orderDate}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Payment Terms
                  </label>
                  <input
                    type="text"
                    name="paymentTerms"
                    value={formState.paymentTerms}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded-md ${
                      errors.paymentTerms ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.paymentTerms && (
                    <p className="text-red-500 text-sm">
                      {errors.paymentTerms}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Shipping Information Card */}
            <Card className="w-full min-w-0">
              <CardHeader className="pb-2">
                <CardTitle>Shipping Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="requiresShipping"
                    checked={requiresShipping}
                    onChange={(e) => setRequiresShipping(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="requiresShipping"
                    className="text-sm font-medium text-gray-700 ml-2"
                  >
                    This order requires shipping
                  </label>
                </div>

                {requiresShipping ? (
                  <>
                    <div className="grid gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="text-sm font-medium text-gray-700">
                        Expected Shipment Date
                      </label>
                      <input
                        type="date"
                        name="shipmentDate"
                        value={formState.shipmentDate}
                        onChange={handleInputChange}
                        className={`w-full p-2 border rounded-md ${
                          errors.shipmentDate
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      {errors.shipmentDate && (
                        <p className="text-red-500 text-sm">
                          {errors.shipmentDate}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Delivery Date
                      </label>
                      <input
                        type="date"
                        name="deliveryDate"
                        value={formState.deliveryDate}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded-md"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Delivery Method
                      </label>
                      <input
                        type="text"
                        name="deliveryMethod"
                        value={formState.deliveryMethod}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded-md"
                      />
                    </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Shipping Address
                      </label>
                      <textarea
                        name="shippingAddress"
                        value={
                          formState.shippingAddress ||
                          (formState.selectedCustomer
                            ? formState.selectedCustomer.shipping_address
                            : "")
                        }
                        onChange={handleInputChange}
                        className="w-full min-w-0 p-2 border rounded-md h-24"
                        placeholder="Enter shipping address"
                      />
                    </div>
                  </>
                ) : null}
              </CardContent>
            </Card>
          </div>

          {/* Items Table */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <ItemTable
                    items={formState.items}
                    setItems={(items) => setFormState((prev) => ({ ...prev, items }))}
                  />
                </div>
              </CardContent>
            </Card>

          {/* Tax and Discount section */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Tax and Discount</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isTaxLoading && (
                <MultiTaxSelection
                  selectedTaxes={selectedTaxes}
                  taxes={taxes}
                  isLoading={isTaxLoading}
                  handleTaxChange={handleTaxChange}
                  error={taxError}
                  removeTax={removeTax}
                />
              )}
              {!isDiscountLoading && (
                <MultiDiscountSelection
                  selectedDiscounts={selectedDiscount}
                  discounts={discounts}
                  handleDiscountChange={handleDiscountChange}
                  isLoading={isDiscountLoading}
                  error={discountError}
                />
              )}
            </CardContent>
          </Card>
          
          {/* Sales Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <SalesSummary
                  className="w-full sm:w-auto max-w-full sm:max-w-[384px]"
                  subTotal={tempPaymentInfo?.subtotal ?? 0}
                  grandTotal={tempPaymentInfo?.grandtotal ?? 0}
                  discountAmount={tempPaymentInfo?.totalDiscountAmount ?? 0}
                  taxAmount={tempPaymentInfo?.totalTaxAmount ?? 0}
                  discounts={tempPaymentInfo?.discounts ?? []}
                  taxes={tempPaymentInfo?.taxes ?? []}
                />
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

export default AddSales;