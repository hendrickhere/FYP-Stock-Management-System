import React, { useState } from 'react';
import { FaTrashAlt, FaEdit, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { motion } from 'framer-motion';
import format from 'date-fns/format';
import isValid from 'date-fns/isValid';
import parseISO from 'date-fns/parseISO';
import { toast } from '../ui/use-toast';
import instance from '../axiosConfig'
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
import SalesOrderModal from './salesOrderInfoModal';

const SalesTable = ({ salesOrders, selectedOrders,  onSelectionChange, userRole, username }) => {

  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [managerPassword, setManagerPassword] = useState('');

  const handleEditData = (order) => {
  setSelectedOrder(order);
  setIsModalOpen(true);
  };

  const handleUpdateOrder = async (updatedOrder) => {
    try {
      // Implement your update logic here
      // Likely need to call an API endpoint
      console.log('Updating order:', updatedOrder);
      // After successful update, close modal and refresh data if needed
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };
  
  // Sorting function
  const sortedOrders = React.useMemo(() => {
    if (!salesOrders?.salesOrders) return [];
    let sortableOrders = [...salesOrders.salesOrders];
    if (sortConfig.key !== null) {
      sortableOrders.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Special handling for nested customer name
        if (sortConfig.key === 'customer') {
          aValue = a.Customer?.customer_name || '';
          bValue = b.Customer?.customer_name || '';
        }

        // Special handling for dates
        if (sortConfig.key === 'order_date_time' || sortConfig.key === 'expected_shipment_date') {
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
  }, [salesOrders, sortConfig]);

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
        ? format(parsedDate, "MMM dd, yyyy hh:mm a")
        : 'N/A';
    } catch (error) {
      return 'N/A';
    }
  };

  const formatAddress = (customer) => {
    if (!customer) return 'N/A';
    return customer.shipping_address || 'No shipping address';
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allOrderIds = sortedOrders.map(order => order.sales_order_uuid);
      onSelectionChange(allOrderIds);
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectOrder = (orderUuid) => {
    onSelectionChange(prev => {
      if (prev.includes(orderUuid)) {
        return prev.filter(id => id !== orderUuid);
      } else {
        return [...prev, orderUuid];
      }
    });
  };

  // Delete handling
  const handleDeleteClick = async (order) => {
    if (userRole !== 'Manager') {
      toast({
        title: "Permission Denied",
        description: "Only managers can delete sales orders.",
        variant: "destructive"
      });
      return;
    }
    setSelectedOrder(order);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedOrder && managerPassword) {
      try {
        await handleDeleteData(selectedOrder.sales_order_uuid, managerPassword);
        toast({
          title: "Success",
          description: "Sales order deleted successfully"
        });
        setDeleteDialogOpen(false);
        setSelectedOrder(null);
        setManagerPassword(''); // Clear password
      } catch (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to delete sales order",
          variant: "destructive"
        });
      }
    }
  };

  const handleDeleteData = async (salesOrderUUID, managerPassword) => {
    try {
      await instance.delete(`/sales/user/${username}/salesOrder/${salesOrderUUID}`, {
        data: { managerPassword }
      });
      
      // Refresh sales orders through parent callback
      onSelectionChange([]);
    } catch (error) {
      console.error('Error deleting sales order:', error);
      throw error;
    }
  };

  if (!salesOrders?.salesOrders) return null;

  return (
    <div className="w-full -mt-4 lg:mt-0">

      {selectedOrder && (
        <SalesOrderModal
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
              key={order.sales_order_uuid}
              className="bg-white rounded-lg shadow-sm p-4 space-y-3 border border-gray-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedOrders.length === sortedOrders.length && sortedOrders.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                  <div>
                    <h3 className="font-medium text-gray-900">Order #{order.sales_order_uuid.slice(0, 8)}</h3>
                    <p className="text-sm text-gray-500">{formatDate(order.order_date_time)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditData(order)}
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
                  <p className="text-gray-500 text-xs uppercase tracking-wider">Customer</p>
                  <p className="font-medium text-gray-900">{order.Customer?.customer_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider">Total</p>
                  <p className="font-medium text-gray-900">
                    {typeof order.total_price === 'number' 
                      ? order.total_price.toLocaleString('en-MY', {
                          style: 'currency',
                          currency: 'MYR'
                        })
                      : 'N/A'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider">Shipment Date</p>
                  <p className="font-medium text-gray-900">
                    {formatDate(order.expected_shipment_date)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider">Delivery Method</p>
                  <p className="font-medium text-gray-900">{order.delivery_method || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500 text-xs uppercase tracking-wider">Shipping Address</p>
                  <p className="font-medium text-gray-900 break-words">
                    {formatAddress(order.Customer)}
                  </p>
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
                      className="rounded border-gray-300"
                    />
                  </th>
                  {[
                    { key: 'sales_order_uuid', label: 'Order ID' },
                    { key: 'order_date_time', label: 'Order Date' },
                    { key: 'expected_shipment_date', label: 'Shipment Date' },
                    { key: 'customer', label: 'Customer' },
                    { key: 'shipping_address', label: 'Shipping Address' },
                    { key: 'total_price', label: 'Total' },
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
                    <td colSpan="8">
                      <EmptyState />
                    </td>
                  </tr>
                ) : (
                  sortedOrders.map((order, index) => (
                    <motion.tr
                      key={order.sales_order_uuid}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-3 py-4">
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(order.sales_order_uuid)}
                          onChange={() => handleSelectOrder(order.sales_order_uuid)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        {order.sales_order_uuid.slice(0, 8)}...
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        {formatDate(order.order_date_time)}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        {formatDate(order.expected_shipment_date)}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        {order.Customer?.customer_name || 'N/A'}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500 truncate">
                        {formatAddress(order.Customer)}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        {typeof order.total_price === 'number' 
                          ? order.total_price.toLocaleString('en-MY', {
                              style: 'currency',
                              currency: 'MYR'
                            })
                          : 'N/A'
                        }
                      </td>
                      <td className="px-3 py-4 text-right text-sm font-medium sticky right-0 bg-white">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditData(order)}
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
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sales Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this sales order? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {userRole === 'Manager' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Enter manager password to confirm
              </label>
              <input
                type="password"
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Manager password"
                onChange={(e) => setManagerPassword(e.target.value)}
                value={managerPassword}
              />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setDeleteDialogOpen(false);
                setManagerPassword('');
                setSelectedOrder(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={userRole === 'Manager' && !managerPassword}
              className="bg-red-500 hover:bg-red-600 text-white"
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
      <span className="text-lg font-medium text-gray-900">No sales orders found</span>
      <p className="text-sm text-gray-500">
        Create a new sales order to get started
      </p>
    </div>
  </div>
);

// Helper function to determine if an order is selectable
const isOrderSelectable = (order) => {
  // Add any business logic to determine if an order can be selected
  // For example, maybe only orders with certain status can be selected
  return true;
};

// Helper function to format currency
const formatCurrency = (amount) => {
  if (typeof amount !== 'number') return 'MYR 0.00';
  return amount.toLocaleString('en-MY', {
    style: 'currency',
    currency: 'MYR'
  });
};

export default SalesTable;