import React, { useState, useContext } from 'react';
import { FaUser, FaSort, FaSortUp, FaSortDown, FaTrashAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
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
import instance from '../axiosConfig';
import { useToast } from '../ui/use-toast';

const StaffTable = ({ staffs, searchConfig, onStaffDeleted }) => {
  const { username } = useContext(GlobalContext);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const { toast } = useToast();
  // Add sorting state
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  // Implement sorting function with useMemo for performance
  const sortedStaffs = React.useMemo(() => {
    if (!staffs) return [];
    let sortableStaffs = [...staffs];

    if (sortConfig.key !== null) {
      sortableStaffs.sort((a, b) => {
        let aValue, bValue;

        // Handle complex nested properties
        if (sortConfig.key === 'organization_name') {
          aValue = a.organization?.organization_name;
          bValue = b.organization?.organization_name;
        } else {
          aValue = a[sortConfig.key];
          bValue = b[sortConfig.key];
        }

        // Handle null/undefined values
        if (!aValue) aValue = '';
        if (!bValue) bValue = '';
        
        // Special handling for dates
        if (sortConfig.key === 'created_at') {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
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
    return sortableStaffs;
  }, [staffs, sortConfig]);

  // Implement filtering with useMemo, using the sorted results
  const filteredStaffs = React.useMemo(() => {
    if (!staffs) return [];
    if (!searchConfig?.term) return sortedStaffs;
    
    const searchTerm = searchConfig.term.toLowerCase().trim();
    return sortedStaffs.filter(staff => {
      return (
        staff.username.toLowerCase().includes(searchTerm) ||
        staff.email.toLowerCase().includes(searchTerm) ||
        staff.role.toLowerCase().includes(searchTerm) ||
        staff.organization?.organization_name?.toLowerCase().includes(searchTerm)
      );
    });
  }, [staffs, searchConfig, sortedStaffs]);

  // Add sort request handler
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Add sort icon helper
  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return <FaSort className="w-3 h-3" />;
    return sortConfig.direction === 'ascending' ? 
      <FaSortUp className="w-3 h-3" /> : 
      <FaSortDown className="w-3 h-3" />;
  };

    const handleDeleteClick = (staff) => {
    setSelectedStaff(staff);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedStaff?.user_id) return;

    try {
      const response = await instance.delete(
        `/staff/staffs/${selectedStaff.user_id}`,
        { params: { username } }
      );

      if (response.data.success) {
        toast({
          title: "Success",
          description: response.data.message || "Staff member deleted successfully",
        });
        
        if (typeof onStaffDeleted === 'function') {
          onStaffDeleted();
        } else {
          console.warn('onStaffDeleted prop is not provided to StaffTable');
        }
      }
    } catch (error) {
      console.error('Error deleting staff:', error);
      
      // Enhanced error handling
      const errorMessage = error.response?.data?.message 
        || error.message 
        || "Failed to delete staff member";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedStaff(null);
    }
  };

  // Modify the table row to include delete button
  const renderTableRow = (staff, index) => (
    <motion.tr
      key={staff.user_id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.05 }}
      className="hover:bg-gray-50"
    >
      <td className="px-3 py-4 text-sm text-gray-900">
        {staff.username}
      </td>
      <td className="px-3 py-4 text-sm text-gray-500">
        {staff.email}
      </td>
      <td className="px-3 py-4 text-sm text-gray-500">
        {staff.role}
      </td>
      <td className="px-3 py-4 text-sm text-gray-500">
        {format(new Date(staff.created_at), 'MMM dd, yyyy')}
      </td>
      <td className="px-3 py-4 text-sm text-gray-500">
        {staff.organization?.organization_name}
      </td>
      <td className="px-3 py-4 text-right">
        <button
          onClick={() => handleDeleteClick(staff)}
          className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
        >
          <FaTrashAlt className="w-4 h-4 text-red-500 hover:text-red-700" />
        </button>
      </td>
    </motion.tr>
  );

  if (!staffs) return null;

  return (
    <div className="w-full mt-4 lg:mt-0">
      {/* Mobile View - Card Layout */}
      <div className="block lg:hidden space-y-4 max-h-[calc(100vh-15rem)] overflow-y-auto">
        {filteredStaffs.length === 0 ? (
          <EmptyState />
        ) : (
          filteredStaffs.map((staff, index) => (
            <motion.div
              key={staff.user_id}
              className="bg-white rounded-lg shadow-sm p-4 space-y-3 border border-gray-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {/* Header with Name and Actions */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900">{staff.username}</h3>
                  <p className="text-sm text-gray-500">ID: {staff.user_id}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeleteClick(staff)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <FaTrashAlt className="text-red-500 hover:text-red-700 w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider">Email</p>
                  <p className="font-medium text-gray-900 truncate">{staff.email}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider">Role</p>
                  <p className="font-medium text-gray-900">{staff.role}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider">Join Date</p>
                  <p className="font-medium text-gray-900">
                    {format(new Date(staff.created_at), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider">Organization</p>
                  <p className="font-medium text-gray-900">{staff.organization?.organization_name}</p>
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
                    { key: 'username', label: 'Username' },
                    { key: 'email', label: 'Email' },
                    { key: 'role', label: 'Role' },
                    { key: 'created_at', label: 'Join Date' },
                    { key: 'organization_name', label: 'Organization' },
                    { key: 'actions', label: '' }
                  ].map(column => (
                    <th
                      key={column.key}
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                      onClick={() => column.key !== 'actions' && requestSort(column.key)}
                    >
                      <div className="flex items-center gap-1">
                        {column.label}
                        {column.key !== 'actions' && getSortIcon(column.key)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStaffs.length === 0 ? (
                  <tr>
                    <td colSpan="6">
                      <EmptyState />
                    </td>
                  </tr>
                ) : (
                  filteredStaffs.map((staff, index) => renderTableRow(staff, index))
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
              <AlertDialogTitle>Delete Staff Member</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this staff member? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteConfirm}
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
      <FaUser className="w-12 h-12 text-gray-400" />
      <span className="text-lg font-medium text-gray-900">No staff members found</span>
      <p className="text-sm text-gray-500">
        No staff members match your search criteria
      </p>
    </div>
  </div>
);

export default StaffTable;