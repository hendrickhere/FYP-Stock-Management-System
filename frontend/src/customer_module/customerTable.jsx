import React, { useState, useContext } from 'react';
import { FaTrashAlt, FaEdit, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { GlobalContext } from '../globalContext';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import instance from '../axiosConfig';

const CustomerTable = ({ customers, handleEditData, searchConfig }) => {
  const { username } = useContext(GlobalContext);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  // Sorting function
  const sortedCustomers = React.useMemo(() => {
    if (!customers) return [];
    let sortableCustomers = [...customers];
    if (sortConfig.key !== null) {
      sortableCustomers.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableCustomers;
  }, [customers, sortConfig]);

  // Filtered customers based on search
  const filteredCustomers = React.useMemo(() => {
    if (!customers) return [];
    if (!searchConfig?.term) return sortedCustomers;
    
    return sortedCustomers.filter(customer => {
      const searchTerm = searchConfig.term.toLowerCase().trim();
      
      const matchesId = customer.customer_id?.toString().toLowerCase().includes(searchTerm);
      const matchesName = customer.customer_name?.toLowerCase().includes(searchTerm);
      const matchesEmail = customer.customer_email?.toLowerCase().includes(searchTerm);
      const matchesPhone = customer.customer_contact?.toString().toLowerCase().includes(searchTerm);
      const matchesCompany = customer.customer_company?.toLowerCase().includes(searchTerm);
      const matchesAddress = customer.shipping_address?.toLowerCase().includes(searchTerm);
      
      return matchesId || matchesName || matchesEmail || matchesPhone || matchesCompany || matchesAddress;
    });
  }, [customers, searchConfig, sortedCustomers]);

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

  const handleDeleteData = async (customer) => {
  if (!customer?.customer_uuid) return;
  
  try {
    const response = await instance.delete(
      `/stakeholders/customer/${customer.customer_uuid}?username=${username}`
    );
    if (response.data) {
      // Refresh the customer list or remove from local state
      window.location.reload();
    }
  } catch (error) {
    console.error('Error deleting customer:', error);
  }
  };

  // Delete handling
  const handleDeleteClick = (customer) => {
    setSelectedCustomer(customer);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedCustomer) {
      handleDeleteData(selectedCustomer);
      setDeleteDialogOpen(false);
      setSelectedCustomer(null);
    }
  };

  // Edit handling
  const handleEditClick = (customer) => {
    setEditFormData({
      customer_uuid: customer.customer_uuid,
      customer_name: customer.customer_name,
      customer_email: customer.customer_email,
      customer_contact: customer.customer_contact,
      customer_company: customer.customer_company,
      customer_designation: customer.customer_designation,
      billing_address: customer.billing_address,
      shipping_address: customer.shipping_address
    });
    setEditDialogOpen(true);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditSubmit = async () => {
    try {
      console.log("Submitting edit for customer:", editFormData); 

      const response = await instance.put(
        `/stakeholders/customers/${editFormData.customer_uuid}?username=${username}`,
        {
          customerName: editFormData.customer_name,
          customerEmail: editFormData.customer_email,
          customerDesignation: editFormData.customer_designation || 'Mr',
          customerContact: editFormData.customer_contact,
          customerCompany: editFormData.customer_company,
          billingAddress: editFormData.billing_address,
          shippingAddress: editFormData.shipping_address
        }
      );

      if (response.data) {
        setEditDialogOpen(false);
        window.location.reload();
      }
    } catch (error) {
      console.error('Error updating customer:', error);
    }
  };

  if (!customers) return null;

  return (
    <div className="w-full mt-4 lg:mt-0">
      {/* Mobile View - Card Layout */}
      <div className="block lg:hidden space-y-4 max-h-[calc(100vh-15rem)] overflow-y-auto ">
        {customers.length === 0 ? (
          <EmptyState />
        ) : (
          filteredCustomers.map((customer, index) => (
            <motion.div
              key={customer.customer_id}
              className="bg-white rounded-lg shadow-sm p-4 space-y-3 border border-gray-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900">{customer.customer_name}</h3>
                  <p className="text-sm text-gray-500">ID: {customer.customer_id}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditClick(customer)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <FaEdit className="text-gray-500 hover:text-gray-700 w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(customer)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <FaTrashAlt className="text-red-500 hover:text-red-700 w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider">Email</p>
                  <p className="font-medium text-gray-900 truncate">{customer.customer_email}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider">Phone</p>
                  <p className="font-medium text-gray-900">{customer.customer_contact}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider">Company</p>
                  <p className="font-medium text-gray-900">{customer.customer_company || 'unknown'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider">Created At</p>
                  <p className="font-medium text-gray-900">
                    {new Date(customer.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500 text-xs uppercase tracking-wider">Address</p>
                  <p className="font-medium text-gray-900 break-words">
                    {customer.shipping_address}
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
                  {[
                    { key: 'customer_id', label: 'ID' },
                    { key: 'customer_name', label: 'Name' },
                    { key: 'customer_email', label: 'Email' },
                    { key: 'customer_contact', label: 'Phone' },
                    { key: 'customer_company', label: 'Company' },
                    { key: 'shipping_address', label: 'Address' },
                    { key: 'created_at', label: 'Created At' },
                  ].map(column => (
                    <th
                      key={column.key}
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                      onClick={() => requestSort(column.key)}
                    >
                      <div className="flex items-center gap-1">
                        {column.label}
                        {getSortIcon(column.key)}
                      </div>
                    </th>
                  ))}
                  <th className="w-24 px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase sticky right-0 bg-gray-50">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="8">
                      <EmptyState />
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer, index) => (
                    <motion.tr
                      key={customer.customer_id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-3 py-4 text-sm text-gray-900">
                        {customer.customer_id}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        {customer.customer_name}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500 truncate">
                        {customer.customer_email}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        {customer.customer_contact}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        {customer.customer_company || 'unknown'}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500 truncate">
                        {customer.shipping_address}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        {new Date(customer.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-4 text-right text-sm font-medium sticky right-0 bg-white">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditClick(customer)}
                            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                          >
                            <FaEdit className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(customer)}
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
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this customer? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <AlertDialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <AlertDialogContent className="bg-white sm:max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Customer</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium text-gray-700 required-field">
                Name
              </label>
              <input
                name="customer_name"
                value={editFormData.customer_name || ''}
                onChange={handleEditFormChange}
                maxLength={255}
                className="col-span-3 p-2 border rounded-md"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium text-gray-700 required-field">
                Email
              </label>
              <input
                name="customer_email"
                type="email"
                value={editFormData.customer_email || ''}
                onChange={handleEditFormChange}
                maxLength={255}
                className="col-span-3 p-2 border rounded-md"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium text-gray-700 required-field">
                Contact
              </label>
              <input
                name="customer_contact"
                value={editFormData.customer_contact || ''}
                onChange={handleEditFormChange}
                maxLength={255}
                className="col-span-3 p-2 border rounded-md"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium text-gray-700">
                Company
              </label>
              <input
                name="customer_company"
                value={editFormData.customer_company || ''}
                onChange={handleEditFormChange}
                maxLength={255}
                className="col-span-3 p-2 border rounded-md"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium text-gray-700">
                Designation
              </label>
              <select
                name="customer_designation"
                value={editFormData.customer_designation || 'Mr'}
                onChange={handleEditFormChange}
                className="col-span-3 p-2 border rounded-md"
              >
                <option value="Mr">Mr</option>
                <option value="Mrs">Mrs</option>
                <option value="Ms">Ms</option>
                <option value="Dr">Dr</option>
              </select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium text-gray-700">
                Billing Address
              </label>
              <textarea
                name="billing_address"
                value={editFormData.billing_address || ''}
                onChange={handleEditFormChange}
                maxLength={255}
                rows={3}
                className="col-span-3 p-2 border rounded-md"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium text-gray-700">
                Shipping Address
              </label>
              <textarea
                name="shipping_address"
                value={editFormData.shipping_address || ''}
                onChange={handleEditFormChange}
                maxLength={255}
                rows={3}
                className="col-span-3 p-2 border rounded-md"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <button
              onClick={() => setEditDialogOpen(false)}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleEditSubmit}
              className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Save Changes
            </button>
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
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
      <span className="text-lg font-medium text-gray-900">No customers found</span>
      <p className="text-sm text-gray-500">
        Add a new customer to get started
      </p>
    </div>
  </div>
);

export default CustomerTable;