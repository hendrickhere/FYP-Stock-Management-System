import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog } from '@headlessui/react';
import { X, Edit, Save, Trash } from 'lucide-react';
import { Tab } from '@headlessui/react';
import { toast } from '../ui/use-toast';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from '../ui/alert-dialog';

const SalesOrderModal = ({ isOpen, onClose, order, onUpdate, onDelete, userRole }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedOrder, setEditedOrder] = useState(order);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [pendingAction, setPendingAction] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isManager = userRole === 'Manager';

  useEffect(() => {
    if (order) {
      setEditedOrder(order);
    }
  }, [order]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
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

  const handleEdit = (field, value) => {
    setEditedOrder(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (isManager) {
        setShowPasswordDialog(true);
        setPendingAction('edit');
      } else {
        await onUpdate(editedOrder);
        setIsEditing(false);
        setHasChanges(false);
        toast({
          title: "Success",
          description: "Sales order updated successfully"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (isManager) {
      setShowDeleteConfirm(true);
    } else {
      toast({
        title: "Permission Denied",
        description: "Only managers can delete sales orders.",
        variant: "destructive"
      });
    }
  };

  const handlePasswordVerification = async () => {
    try {
      if (pendingAction === 'edit') {
        await onUpdate(editedOrder);
        setIsEditing(false);
      } else if (pendingAction === 'delete') {
        await onDelete(order.sales_order_uuid);
        onClose();
      }
      
      setShowPasswordDialog(false);
      setAdminPassword('');
      setPendingAction(null);
      setHasChanges(false);
      
      toast({
        title: "Success",
        description: `Sales order ${pendingAction === 'edit' ? 'updated' : 'deleted'} successfully`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
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
                Order #{order?.sales_order_uuid.slice(0, 8)}
              </h2>
              <div className="flex gap-2">
                {!isEditing && isManager && (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-2 hover:bg-gray-100 rounded-full"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleDelete}
                      className="p-2 hover:bg-gray-100 rounded-full text-red-500"
                    >
                      <Trash className="w-5 h-5" />
                    </button>
                  </>
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
                        <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Name</p>
                            <p className="font-medium">
                              {editedOrder?.Customer?.customer_name || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Contact</p>
                            <p className="font-medium">
                              {editedOrder?.Customer?.customer_contact || 'N/A'}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-sm text-gray-500">Shipping Address</p>
                            <p className="font-medium">
                              {editedOrder?.Customer?.shipping_address || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold mb-4">Order Dates</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Order Date</p>
                            <p className="font-medium">
                              {formatDate(editedOrder?.order_date_time)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Expected Shipment</p>
                            <p className="font-medium">
                              {formatDate(editedOrder?.expected_shipment_date)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Tab.Panel>

                  {/* Products Panel */}
                  <Tab.Panel>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold mb-4">Order Products</h3>
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Product
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                              Quantity
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                              Price
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {editedOrder?.Products?.map((product) => (
                            <tr key={product.product_uuid}>
                              <td className="px-6 py-4">
                                <div>
                                  <p className="font-medium">{product.product_name}</p>
                                  <p className="text-sm text-gray-500">
                                    SKU: {product.sku_number}
                                  </p>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                {product.SalesOrderInventory?.quantity || 0}
                              </td>
                              <td className="px-6 py-4 text-right">
                                {formatCurrency(product.SalesOrderInventory?.price || 0)}
                              </td>
                              <td className="px-6 py-4 text-right">
                                {formatCurrency(
                                  (product.SalesOrderInventory?.price || 0) *
                                  (product.SalesOrderInventory?.quantity || 0)
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Tab.Panel>

                  {/* Payment Info Panel */}
                  <Tab.Panel>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold mb-4">Payment Details</h3>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-500">Payment Terms</p>
                          <p className="font-medium">
                            {editedOrder?.payment_terms || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Delivery Method</p>
                          <p className="font-medium">
                            {editedOrder?.delivery_method || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Tab.Panel>
                </Tab.Panels>
              </Tab.Group>

              {/* Footer Actions */}
              {isEditing && (
                <div className="mt-6 flex justify-end gap-3 border-t pt-4">
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
              )}
            </div>
          </motion.div>

          {/* Password Dialog */}
          <AlertDialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
            <AlertDialogContent>
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
              />
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => {
                  setShowPasswordDialog(false);
                  setAdminPassword('');
                  setPendingAction(null);
                }}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction onClick={handlePasswordVerification}>
                  Verify
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
                  Are you sure you want to delete this sales order? This action cannot be undone.
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
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default SalesOrderModal;