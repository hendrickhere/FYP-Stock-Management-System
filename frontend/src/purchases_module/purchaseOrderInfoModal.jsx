import React, { useState, useContext, useEffect } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog } from '@headlessui/react';
import { X, Edit, Save, Trash, Plus, Minus } from 'lucide-react';
import { Tab } from '@headlessui/react';
import { toast, Toaster } from 'react-hot-toast';
import { GlobalContext } from "../globalContext";
import instance from '../axiosConfig';
import PurchaseOrderProducts from './purchaseOrderProducts';
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

const PurchaseOrderModal = ({ isOpen, onClose, order, onUpdate, onDelete, userRole }) => {
  const [editedOrder, setEditedOrder] = useState(order);
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [pendingAction, setPendingAction] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [availableProducts, setAvailableProducts] = useState([]);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [vendorData, setVendorData] = useState(null);
  const [showVendorSearch, setShowVendorSearch] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const { username } = useContext(GlobalContext);

  const isManager = userRole === 'Manager';

  useEffect(() => {
    const initializeData = async () => {
      // Fetch products regardless of edit mode
      await fetchAvailableProducts();
      
      if (order) {
        // Ensure PurchaseOrderItems are loaded with their Products
        const orderWithItems = {
          ...order,
          PurchaseOrderItems: order.PurchaseOrderItems?.map(item => ({
            ...item,
            // If Product is already included in the item, use it; otherwise find it in availableProducts
            Product: item.Product || availableProducts.find(p => p.product_id === item.product_id)
          }))
        };
        setEditedOrder(orderWithItems);
      }
    };

    initializeData();
  }, [order]);

  // Separate effect for vendor fetching
  useEffect(() => {
    if (isEditing) {
      fetchVendors();
    }
  }, [isEditing]);

  const fetchAvailableProducts = async () => {
    try {
      const response = await instance.get(`/user/${username}/inventories`);
      if (response.data?.inventories) {
        setAvailableProducts(response.data.inventories);
      } else {
        throw new Error('No inventory data received');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load available products');
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await instance.get(`/stakeholders/vendors?username=${username}`);
      setVendorData(response.data);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      toast.error('Failed to fetch vendors');
    }
  };

  const handleEdit = (field, value) => {
    setEditedOrder(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const handleVendorChange = (vendor) => {
    setEditedOrder(prev => ({
      ...prev,
      Vendor: vendor,
      vendor_id: vendor.vendor_id
    }));
    setHasChanges(true);
    setShowVendorSearch(false);
  };

  const handleProductQuantityChange = (productId, newQuantity) => {
      setEditedOrder(prev => {
        const updatedItems = prev.PurchaseOrderItems.map(item => {
          if (item.product_id === productId) {
            const productCost = item.Product?.cost || 0;
            return { 
              ...item,
              quantity: parseInt(newQuantity) || 0,
              total_price: (parseInt(newQuantity) || 0) * productCost
            };
          }
          return item;
        });

        // Recalculate totals
        const subtotal = updatedItems.reduce((sum, item) => sum + (item.total_price || 0), 0);
        const totalTax = calculateTotalTax(subtotal, prev.PurchaseOrderTaxes || []);
        const grandTotal = subtotal + totalTax;

        return {
          ...prev,
          PurchaseOrderItems: updatedItems,
          subtotal,
          total_tax: totalTax,
          grand_total: grandTotal
        };
      });
      setHasChanges(true);
  };

  const calculateTotalTax = (subtotal, taxes) => {
    return taxes.reduce((total, tax) => {
      const taxAmount = (subtotal * (tax.applied_tax_rate / 100));
      return total + taxAmount;
    }, 0);
  };

  const handleAddProduct = (newProduct) => {
    setEditedOrder(prev => {
      const updatedItems = [...(prev.PurchaseOrderItems || [])];
      
      const existingItemIndex = updatedItems.findIndex(
        item => item.product_id === newProduct.product_id
      );
      
      if (existingItemIndex >= 0) {
        const existingItem = updatedItems[existingItemIndex];
        updatedItems[existingItemIndex] = {
          ...existingItem,
          quantity: existingItem.quantity + 1,
          total_price: (existingItem.quantity + 1) * newProduct.Product.cost
        };
      } else {
        updatedItems.push({
          ...newProduct,
          total_price: newProduct.Product.cost
        });
      }

      // Recalculate totals
      const subtotal = updatedItems.reduce((sum, item) => sum + (item.total_price || 0), 0);
      const totalTax = calculateTotalTax(subtotal, prev.PurchaseOrderTaxes || []);
      const grandTotal = subtotal + totalTax;

      return {
        ...prev,
        PurchaseOrderItems: updatedItems,
        subtotal,
        total_tax: totalTax,
        grand_total: grandTotal
      };
    });
    setHasChanges(true);
  };

  const handleRemoveProduct = (productId) => {
    setEditedOrder(prev => {
      const updatedItems = prev.PurchaseOrderItems.filter(
        item => item.product_id !== productId
      );

      // Recalculate totals
      const subtotal = updatedItems.reduce((sum, item) => sum + item.total_price, 0);
      const totalTax = calculateTotalTax(subtotal, prev.PurchaseOrderTaxes);
      const grandTotal = subtotal + totalTax;

      return {
        ...prev,
        PurchaseOrderItems: updatedItems,
        subtotal,
        total_tax: totalTax,
        grand_total: grandTotal
      };
    });
    setHasChanges(true);
  };

  const validateChanges = () => {
    const newErrors = {};
    
    if (!editedOrder.vendor_id) {
      newErrors.vendor = 'Vendor is required';
      toast.error('Please select a vendor');
    }

    if (!editedOrder.order_date) {
      newErrors.orderDate = 'Order date is required';
      toast.error('Please enter order date');
    }

    if (!editedOrder.PurchaseOrderItems?.length) {
      newErrors.products = 'At least one product is required';
      toast.error('Please add at least one product');
    }

    if (!editedOrder.payment_terms) {
      newErrors.paymentTerms = 'Payment terms are required';
      toast.error('Please enter payment terms');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateChanges()) {
      return;
    }

    setIsSaving(true);
    try {
      if (isManager) {
        setShowPasswordDialog(true);
        setPendingAction('edit');
      } else {
        await handleUpdateOrder();
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error(error.message || 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateOrder = async () => {
      try {
          const response = await instance.put(
              `/purchases/user/${username}/${editedOrder.purchase_order_id}`,
              {
                  updatedData: {
                      vendor_id: editedOrder.Vendor.vendor_id, 
                      order_date: editedOrder.order_date,
                      delivered_date: editedOrder.delivered_date,
                      delivery_method: editedOrder.delivery_method,
                      status_id: editedOrder.status_id,
                      payment_terms: editedOrder.payment_terms,
                      PurchaseOrderItems: editedOrder.PurchaseOrderItems.map(item => ({
                          product_id: item.product_id,
                          quantity: item.quantity,
                          total_price: item.total_price
                      }))
                  },
                  managerPassword: adminPassword
              }
          );

          if (response.data.success) {
              toast.success('Purchase order updated successfully');
              setIsEditing(false);
              setHasChanges(false);
              onClose();
              window.location.reload();
          } else {
              throw new Error(response.data.message || 'Failed to update order');
          }
      } catch (error) {
          console.error('Update error:', error);
          if (error.response?.data?.message === "Invalid manager password") {
              toast.error('Invalid manager password');
          } else {
              toast.error(error.response?.data?.message || 'Failed to update order');
          }
          throw error;
      }
  };

  const handleDelete = () => {
    if (!isManager) {
      toast.error('Only managers can delete purchase orders');
      return;
    }
    setShowDeleteConfirm(true);
  };

  const handlePasswordVerification = async () => {
    setIsVerifying(true);
    try {
      if (pendingAction === 'edit') {
        await handleUpdateOrder();
      } else if (pendingAction === 'delete') {
        await onDelete(editedOrder.purchase_order_id, adminPassword);
        toast.success('Purchase order deleted successfully');
        onClose();
      }
      setShowPasswordDialog(false);
      setAdminPassword('');
      setPendingAction(null);
    } catch (error) {
      toast.error('Invalid manager password');
      setAdminPassword('');
    } finally {
      setIsVerifying(false);
    }
  };

  const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    return 'N/A';
  }
};

  const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return 'N/A';
    return amount.toLocaleString('en-MY', {
      style: 'currency',
      currency: 'MYR'
    });
  };

  const getStatusLabel = (statusId) => {
    switch(statusId) {
      case 1: return 'Pending';
      case 2: return 'Approved';
      case 3: return 'Delivered';
      case 4: return 'Cancelled';
      default: return 'Unknown';
    }
  };

  const getStatusColor = (statusId) => {
    switch(statusId) {
      case 1: return 'text-yellow-600 bg-yellow-100';
      case 2: return 'text-green-600 bg-green-100';
      case 3: return 'text-blue-600 bg-blue-100';
      case 4: return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog
          static
          open={isOpen}
          onClose={() => {
            if (hasChanges) {
              if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
                onClose();
              }
            } else {
              onClose();
            }
          }}
          className="fixed inset-0 z-50 overflow-hidden"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 30 }}
            className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl"
          >
            {/* Header */}
            <div className="border-b p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">
                Purchase Order #{order?.purchase_order_id}
              </h2>
              <div className="flex gap-2">
                {!isEditing && isManager && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(100vh-80px)]">
              <Tab.Group>
                <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1 mb-6">
                  {['Order Details', 'Products', 'Payment Info'].map((tab) => (
                    <Tab
                      key={tab}
                      className={({ selected }) =>
                        `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                        ${selected
                          ? 'bg-white text-blue-700 shadow'
                          : 'text-gray-700 hover:bg-white/[0.12] hover:text-blue-600'
                        }`
                      }
                    >
                      {tab}
                    </Tab>
                  ))}
                </Tab.List>

                <Tab.Panels>
                  {/* Order Details Panel */}
                  <Tab.Panel>
                    <div className="space-y-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold mb-4">Vendor Information</h3>
                        {isEditing ? (
                          <div className="relative">
                            <input
                              type="text"
                              readOnly
                              className="w-full p-2 border rounded-md"
                              placeholder="Select Vendor"
                              value={editedOrder?.Vendor?.vendor_name || ''}
                              onClick={() => setShowVendorSearch(true)}
                            />

                            {showVendorSearch && (
                              <div className="absolute w-full z-10">
                                <div className="mt-1 w-full bg-white border rounded-lg shadow-lg">
                                  <ul className="py-1 max-h-60 overflow-auto">
                                    {vendorData?.vendors?.map(vendor => (
                                      <li
                                        key={vendor.vendor_id}
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                        onClick={() => {
                                          handleVendorChange(vendor);
                                          setShowVendorSearch(false);
                                        }}
                                      >
                                        <div className="font-medium">{vendor.vendor_name}</div>
                                        <div className="text-sm text-gray-500">
                                          Contact: {vendor.contact_person}
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-500">Vendor Name</p>
                              <p className="font-medium">
                                {editedOrder?.Vendor?.vendor_name || 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Contact Person</p>
                              <p className="font-medium">
                                {editedOrder?.Vendor?.contact_person || 'N/A'}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold mb-4">Order Details</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Order Date</p>
                            {isEditing ? (
                              <input
                                type="date"
                                value={editedOrder?.order_date?.split('T')[0] || ''}
                                onChange={(e) => handleEdit('order_date', e.target.value)}
                                className="mt-1 w-full rounded-md border-gray-300"
                              />
                            ) : (
                              <p className="font-medium">{formatDate(editedOrder?.order_date)}</p>
                            )}
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Status</p>
                            {isEditing ? (
                              <select
                                value={editedOrder?.status_id || 1}
                                onChange={(e) => handleEdit('status_id', parseInt(e.target.value))}
                                className="mt-1 w-full rounded-md border-gray-300"
                              >
                                <option value={1}>Pending</option>
                                <option value={2}>Approved</option>
                                <option value={3}>Delivered</option>
                                <option value={4}>Cancelled</option>
                              </select>
                            ) : (
                              <p className="font-medium">
                                {getStatusLabel(editedOrder?.status_id)}
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Delivery Method</p>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editedOrder?.delivery_method || ''}
                                onChange={(e) => handleEdit('delivery_method', e.target.value)}
                                className="mt-1 w-full rounded-md border-gray-300"
                              />
                            ) : (
                              <p className="font-medium">
                                {editedOrder?.delivery_method || 'N/A'}
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Delivered Date</p>
                            {isEditing ? (
                              <input
                                type="date"
                                value={editedOrder?.delivered_date?.split('T')[0] || ''}
                                onChange={(e) => handleEdit('delivered_date', e.target.value)}
                                className="mt-1 w-full rounded-md border-gray-300"
                              />
                            ) : (
                              <p className="font-medium">
                                {formatDate(editedOrder?.delivered_date)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Tab.Panel>

                  {/* Products Panel */}
                  <Tab.Panel>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Order Products</h3>
                      </div>
                      
                        <PurchaseOrderProducts 
                          products={editedOrder?.PurchaseOrderItems || []}
                          isEditing={isEditing}
                          onQuantityChange={handleProductQuantityChange}
                          onRemoveProduct={handleRemoveProduct}
                          onAddProduct={handleAddProduct}
                          availableProducts={availableProducts}
                          formatCurrency={formatCurrency}
                        />
                    </div>
                  </Tab.Panel>

                  {/* Payment Info Panel */}
                  <Tab.Panel>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold mb-4">Payment Details</h3>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-500">Payment Terms</p>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editedOrder?.payment_terms || ''}
                              onChange={(e) => handleEdit('payment_terms', e.target.value)}
                              className="mt-1 w-full rounded-md border-gray-300"
                            />
                          ) : (
                            <p className="font-medium">
                              {editedOrder?.payment_terms || 'N/A'}
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500">Subtotal</p>
                          <p className="font-medium">
                            {formatCurrency(editedOrder?.subtotal)}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500">Total Tax</p>
                          <p className="font-medium">
                            {formatCurrency(editedOrder?.total_tax)}
                          </p>
                        </div>
                        
                        <div className="pt-4 border-t">
                          <p className="text-sm font-medium text-gray-500">Grand Total</p>
                          <p className="text-xl font-bold">
                            {formatCurrency(editedOrder?.grand_total)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Tab.Panel>
                </Tab.Panels>
              </Tab.Group>
            </div>

            {/* Footer Actions */}
            {isEditing && (
              <div className="absolute bottom-0 left-0 right-0 border-t bg-white p-4">
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditedOrder(order);
                      setHasChanges(false);
                    }}
                    className="px-4 py-2 text-gray-600 font-medium rounded-md hover:bg-gray-100"
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 disabled:opacity-50"
                    disabled={isSaving || !hasChanges}
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </Dialog>
      )}

        {/* Password Dialog */}
          <AlertDialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
            <AlertDialogContent className="bg-white">
              <AlertDialogHeader>
                <AlertDialogTitle>Manager Verification Required</AlertDialogTitle>
                <AlertDialogDescription>
                  Please enter your manager password to continue.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Enter manager password"
                autoComplete="new-password"
              />
              <AlertDialogFooter>
                <AlertDialogCancel 
                  onClick={() => {
                    setShowPasswordDialog(false);
                    setAdminPassword('');
                    setPendingAction(null);
                  }}
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handlePasswordVerification}
                  disabled={!adminPassword || isVerifying}
                >
                  {isVerifying ? 'Verifying...' : 'Verify'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this purchase order? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setPendingAction('delete');
                    setShowPasswordDialog(true);
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
    </AnimatePresence>
  );
};

export default PurchaseOrderModal;