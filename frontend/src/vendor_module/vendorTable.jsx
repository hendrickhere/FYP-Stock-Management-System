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

const VendorTable = ({ vendors, handleEditData, searchConfig }) => {
  const { username } = useContext(GlobalContext);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  const sortedVendors = React.useMemo(() => {
    if (!vendors) return [];
    let sortableVendors = [...vendors];
    if (sortConfig.key !== null) {
      sortableVendors.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableVendors;
  }, [vendors, sortConfig]);

  const filteredVendors = React.useMemo(() => {
    if (!vendors) return [];
    if (!searchConfig?.term) return sortedVendors;
    
    return sortedVendors.filter(vendor => {
      const searchTerm = searchConfig.term.toLowerCase().trim();
      
      return (
        vendor.vendor_id?.toString().toLowerCase().includes(searchTerm) ||
        vendor.vendor_name?.toLowerCase().includes(searchTerm) ||
        vendor.contact_person?.toLowerCase().includes(searchTerm) ||
        vendor.phone_number?.toString().toLowerCase().includes(searchTerm) ||
        vendor.address?.toLowerCase().includes(searchTerm)
      );
    });
  }, [vendors, searchConfig, sortedVendors]);

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

  const handleDeleteData = async (vendor) => {
    if (!vendor?.vendor_id) return;
    
    try {
      const response = await instance.delete(
        `/stakeholders/vendors/${vendor.vendor_id}?username=${username}`
      );
      if (response.data) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error deleting vendor:', error);
    }
  };

  const handleDeleteClick = (vendor) => {
    setSelectedVendor(vendor);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedVendor) {
      handleDeleteData(selectedVendor);
      setDeleteDialogOpen(false);
      setSelectedVendor(null);
    }
  };

  const handleEditClick = (vendor) => {
    setEditFormData({
      vendor_id: vendor.vendor_id,
      vendor_name: vendor.vendor_name,
      contact_person: vendor.contact_person,
      phone_number: vendor.phone_number,
      address: vendor.address
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
      const response = await instance.put(
        `/stakeholders/vendors/${editFormData.vendor_id}?username=${username}`,
        {
          vendorName: editFormData.vendor_name,
          contactPerson: editFormData.contact_person,
          phoneNumber: editFormData.phone_number,
          address: editFormData.address
        }
      );

      if (response.data) {
        setEditDialogOpen(false);
        window.location.reload();
      }
    } catch (error) {
      console.error('Error updating vendor:', error);
    }
  };

  if (!vendors) return null;

  return (
    <div className="w-full -mt-4 lg:mt-0">
      {/* Mobile View - Card Layout */}
      <div className="block lg:hidden space-y-4 px-4 max-h-[calc(100vh-15rem)] overflow-y-auto">
        {vendors.length === 0 ? (
          <EmptyState />
        ) : (
          filteredVendors.map((vendor, index) => (
            <motion.div
              key={vendor.vendor_id}
              className="bg-white rounded-lg shadow-sm p-4 space-y-3 border border-gray-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900">{vendor.vendor_name}</h3>
                  <p className="text-sm text-gray-500">ID: {vendor.vendor_id}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditClick(vendor)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <FaEdit className="text-gray-500 hover:text-gray-700 w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(vendor)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <FaTrashAlt className="text-red-500 hover:text-red-700 w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider">Contact Person</p>
                  <p className="font-medium text-gray-900">{vendor.contact_person}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider">Phone</p>
                  <p className="font-medium text-gray-900">{vendor.phone_number}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider">Status</p>
                  <p className="font-medium text-gray-900">{vendor.status_id === 1 ? 'Active' : 'Inactive'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider">Created At</p>
                  <p className="font-medium text-gray-900">
                    {new Date(vendor.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500 text-xs uppercase tracking-wider">Address</p>
                  <p className="font-medium text-gray-900 break-words">
                    {vendor.address}
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
                    { key: 'vendor_id', label: 'ID' },
                    { key: 'vendor_name', label: 'Name' },
                    { key: 'contact_person', label: 'Contact Person' },
                    { key: 'phone_number', label: 'Phone' },
                    { key: 'address', label: 'Address' },
                    { key: 'status_id', label: 'Status' },
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
                {filteredVendors.length === 0 ? (
                  <tr>
                    <td colSpan="8">
                      <EmptyState />
                    </td>
                  </tr>
                ) : (
                  filteredVendors.map((vendor, index) => (
                    <motion.tr
                      key={vendor.vendor_id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-3 py-4 text-sm text-gray-900">{vendor.vendor_id}</td>
                      <td className="px-3 py-4 text-sm text-gray-900">{vendor.vendor_name}</td>
                      <td className="px-3 py-4 text-sm text-gray-500">{vendor.contact_person}</td>
                      <td className="px-3 py-4 text-sm text-gray-500">{vendor.phone_number}</td>
                      <td className="px-3 py-4 text-sm text-gray-500 truncate">{vendor.address}</td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        {vendor.status_id === 1 ? 'Active' : 'Inactive'}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        {new Date(vendor.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-4 text-right text-sm font-medium sticky right-0 bg-white">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditClick(vendor)}
                            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                          >
                            <FaEdit className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(vendor)}
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
            <AlertDialogTitle>Delete Vendor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this vendor? This action cannot be undone.
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
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Vendor</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm">Name</label>
              <input
                name="vendor_name"
                value={editFormData.vendor_name || ''}
                onChange={handleEditFormChange}
                className="col-span-3 p-2 border rounded-md"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm">Contact Person</label>
              <input
                name="contact_person"
                value={editFormData.contact_person || ''}
                onChange={handleEditFormChange}
                className="col-span-3 p-2 border rounded-md"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm">Phone</label>
              <input
                name="phone_number"
                value={editFormData.phone_number || ''}
                onChange={handleEditFormChange}
                className="col-span-3 p-2 border rounded-md"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm">Address</label>
              <textarea
                name="address"
                value={editFormData.address || ''}
                onChange={handleEditFormChange}
                className="col-span-3 p-2 border rounded-md"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
      <span className="text-lg font-medium text-gray-900">No vendors found</span>
      <p className="text-sm text-gray-500">
        Add a new vendor to get started
      </p>
    </div>
  </div>
);

export default VendorTable;