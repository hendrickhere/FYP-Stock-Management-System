import React, { useState, useEffect } from 'react';
import { FaTrashAlt, FaEdit, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { motion } from 'framer-motion';
import format from 'date-fns/format';
import isValid from 'date-fns/isValid';
import parseISO from 'date-fns/parseISO';
import toast, { Toaster } from 'react-hot-toast';
import PurchaseOrderModal from './purchaseOrderInfoModal';
import instance from '../axiosConfig';
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

const PurchaseTable = ({ 
  purchases, 
  selectedOrders,  
  onSelectionChange, 
  handleEditData, 
  username,
  highlightSelections,
  setHighlightSelections,
  userRole 
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [adminPassword, setAdminPassword] = useState('');

  useEffect(() => {
    if (highlightSelections) {
      const timer = setTimeout(() => {
        setHighlightSelections(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [highlightSelections, setHighlightSelections]);

  const getCheckboxClass = () => {
    const baseClass = "rounded border-gray-300";
    return highlightSelections 
      ? `${baseClass} ring-2 ring-red-500 ring-opacity-50 animate-pulse` 
      : baseClass;
  };

  const handleEditClick = (order) => {
    console.log('Order being edited:', order);
    console.log('Order items:', order.PurchaseOrderItems);
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  // Sorting function
  const sortedOrders = React.useMemo(() => {
    if (!purchases?.purchases) return [];
    let sortableOrders = [...purchases.purchases];
    if (sortConfig.key !== null) {
      sortableOrders.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Special handling for nested vendor name
        if (sortConfig.key === 'vendor') {
          aValue = a.Vendor?.vendor_name || '';
          bValue = b.Vendor?.vendor_name || '';
        }

        // Special handling for dates
        if (sortConfig.key === 'order_date' || sortConfig.key === 'delivered_date') {
          aValue = new Date(aValue || 0).getTime();
          bValue = new Date(bValue || 0).getTime();
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableOrders;
  }, [purchases, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return <FaSort className="w-3 h-3" />;
    return sortConfig.direction === 'ascending' ? 
      <FaSortUp className="w-3 h-3" /> : 
      <FaSortDown className="w-3 h-3" />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const parsedDate = parseISO(dateString);
      return isValid(parsedDate) 
        ? format(parsedDate, "MMM dd, yyyy")
        : 'N/A';
    } catch (error) {
      return 'N/A';
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allOrderIds = sortedOrders.map(order => order.purchase_order_id);
      onSelectionChange(allOrderIds);
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectOrder = (orderId) => {
    onSelectionChange(prev => {
      if (prev.includes(orderId)) {
        return prev.filter(id => id !== orderId);
      } else {
        return [...prev, orderId];
      }
    });
  };

  const handleDeleteClick = (order) => {
    if (!order) {
      console.error('No order selected for deletion');
      return;
    }
    setSelectedOrder(order);
    setDeleteDialogOpen(true);
  };

  const handleDeleteData = async (order) => {
    try {
      const response = await instance.delete(
        `/purchases/user/${username}/${order.purchase_order_id}`,
        { data: { managerPassword: adminPassword } }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        
        // If inventory was reverted, show detailed notification
        if (response.data.inventoryReverted && response.data.revertedQuantities?.length > 0) {
          const details = response.data.revertedQuantities
            .map(item => `${item.productName} (SKU: ${item.sku}): -${item.quantity} units`)
            .join('\n');
          
          toast.info(`Inventory quantities reverted:\n${details}`, {
            duration: 5000
          });
        }

        // Refresh the data
        window.location.reload();
      }
    } catch (error) {
      if (error.response?.data?.code === 'INVALID_MANAGER_PASSWORD') {
        toast.error('Invalid manager password');
      } else {
        toast.error(error.response?.data?.message || 'Error deleting purchase order');
      }
    } finally {
      setDeleteDialogOpen(false);
      setSelectedOrder(null);
      setAdminPassword('');
    }
  };

  const getDeleteWarningMessage = (order) => {
    if (!order) return "Are you sure you want to delete this purchase order? This action cannot be undone.";
    
    if (order.status_id === 3) {
      return "Warning: Deleting this delivered purchase order will revert the inventory quantities. This action cannot be undone.";
    }
    return "Are you sure you want to delete this purchase order? This action cannot be undone.";
  };

  const handleUpdateOrder = async (updatedOrder) => {
      try {
          const response = await instance.put(
              `/purchases/user/${username}/${updatedOrder.purchase_order_id}`,
              {
                  updatedData: updatedOrder,
                  managerPassword: updatedOrder.managerPassword 
              }
          );

          if (response.data.success) {
              toast.success("Purchase order updated successfully");
              window.location.reload();
          }

          setIsModalOpen(false);
          return response.data;
      } catch (error) {
          console.error('Error updating order:', error);
          toast.error(error.response?.data?.message || 'Failed to update order');
          throw error;
      }
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

  if (!purchases?.purchases) return null;

  return (
    <div className="w-full -mt-4 lg:mt-0">
      <Toaster position="bottom-right" />

        {selectedOrder && (
          <PurchaseOrderModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedOrder(null);
            }}
            order={selectedOrder}
            onUpdate={handleUpdateOrder}
            onDelete={handleDeleteData}
            userRole={userRole}
          />
        )}

      {/* Mobile View - Card Layout */}
      <div className="block lg:hidden space-y-4 px-4 max-h-[calc(100vh-15rem)] overflow-y-auto">
        {sortedOrders.length === 0 ? (
          <EmptyState />
        ) : (
          sortedOrders.map((order, index) => (
            <motion.div
              key={order.purchase_order_id}
              className="bg-white rounded-lg shadow-sm p-4 space-y-3 border border-gray-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedOrders.includes(order.purchase_order_id)}
                    onChange={() => handleSelectOrder(order.purchase_order_id)}
                    className={getCheckboxClass()}
                  />
                  <div>
                    <h3 className="font-medium text-gray-900">PO #{order.purchase_order_id}</h3>
                    <p className="text-sm text-gray-500">{formatDate(order.order_date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditClick(order)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <FaEdit className="text-gray-500 hover:text-gray-700 w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(order)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <FaTrashAlt className="text-red-500 hover:text-red-700 w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider">Vendor</p>
                  <p className="font-medium text-gray-900">{order.Vendor?.vendor_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider">Status</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status_id)}`}>
                    {getStatusLabel(order.status_id)}
                  </span>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider">Total Amount</p>
                  <p className="font-medium text-gray-900">
                    {order.total_amount?.toLocaleString('en-MY', {
                      style: 'currency',
                      currency: 'MYR'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider">Delivered Date</p>
                  <p className="font-medium text-gray-900">{formatDate(order.delivered_date)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500 text-xs uppercase tracking-wider">Payment Terms</p>
                  <p className="font-medium text-gray-900">{order.payment_terms || 'N/A'}</p>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Desktop View - Table Layout */}
      <div className="hidden lg:block">
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="max-h-[calc(100vh-16rem)] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200 table-fixed">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="w-12 px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selectedOrders.length === sortedOrders.length && sortedOrders.length > 0}
                      onChange={handleSelectAll}
                      className={getCheckboxClass()}
                    />
                  </th>
                  {[
                    { key: 'purchase_order_id', label: 'PO Number' },
                    { key: 'order_date', label: 'Order Date' },
                    { key: 'vendor', label: 'Vendor' },
                    { key: 'total_amount', label: 'Total Amount' },
                    { key: 'status_id', label: 'Status' },
                    { key: 'delivered_date', label: 'Delivered Date' },
                    { key: 'payment_terms', label: 'Payment Terms' },
                  ].map(column => (
                    <th
                      key={column.key}
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => requestSort(column.key)}
                    >
                      <div className="flex items-center gap-1">
                        {column.label}
                        {getSortIcon(column.key)}
                      </div>
                    </th>
                  ))}
                  <th className="w-24 px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedOrders.length === 0 ? (
                  <tr>
                    <td colSpan="9">
                      <EmptyState />
                    </td>
                  </tr>
                ) : (
                  sortedOrders.map((order, index) => (
                    <motion.tr
                      key={order.purchase_order_id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-3 py-4">
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(order.purchase_order_id)}
                          onChange={() => handleSelectOrder(order.purchase_order_id)}
                          className={getCheckboxClass()}
                        />
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        #{order.purchase_order_id}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        {formatDate(order.order_date)}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        {order.Vendor?.vendor_name || 'N/A'}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        {order.total_amount?.toLocaleString('en-MY', {
                          style: 'currency',
                          currency: 'MYR'
                        })}
                      </td>
                      <td className="px-3 py-4 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status_id)}`}>
                          {getStatusLabel(order.status_id)}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        {formatDate(order.delivered_date)}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        {order.payment_terms || 'N/A'}
                      </td>
                      <td className="px-3 py-4 text-right text-sm font-medium sticky right-0 bg-white">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditClick(order)}
                            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                          >
                            <FaEdit className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(order)}
                            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                          >
                            <FaTrashAlt className="w-4 h-4 text-red-500 hover:text-red-700" />
                            </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen && selectedOrder !== null} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Purchase Order</AlertDialogTitle>
            <AlertDialogDescription>
              {getDeleteWarningMessage(selectedOrder)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Manager Password
            </label>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Enter manager password"
              autoComplete="new-password"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setDeleteDialogOpen(false);
                setSelectedOrder(null);
                setAdminPassword('');
              }}
            >
              Cancel
            </AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => selectedOrder ? handleDeleteData(selectedOrder) : null}
                className="bg-red-500 hover:bg-red-600 text-white"
                disabled={!adminPassword || !selectedOrder}
              >
                Delete
              </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const EmptyState = () => (
  <div className="text-center py-12">
    <div className="flex flex-col items-center justify-center space-y-3">
      <svg
        className="w-12 h-12 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <span className="text-lg font-medium text-gray-900">No purchase orders found</span>
      <p className="text-sm text-gray-500">
        Create a new purchase order to get started
      </p>
    </div>
  </div>
);

// Helper function to format currency
const formatCurrency = (amount) => {
  if (typeof amount !== 'number') return 'MYR 0.00';
  return amount.toLocaleString('en-MY', {
    style: 'currency',
    currency: 'MYR'
  });
};

export default PurchaseTable;