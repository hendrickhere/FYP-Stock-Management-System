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
import instance from '../axiosConfig';

const AppointmentTable = ({ appointments, searchConfig }) => {
  const { username } = useContext(GlobalContext);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  const sortedAppointments = React.useMemo(() => {
    if (!appointments) return [];
    let sortableAppointments = [...appointments];
    if (sortConfig.key !== null) {
      sortableAppointments.sort((a, b) => {
        let aValue, bValue;

        // Handle nested Customer properties
        if (sortConfig.key === 'customer_name') {
          aValue = a.Customer?.customer_name;
          bValue = b.Customer?.customer_name;
        } else {
          aValue = a[sortConfig.key];
          bValue = b[sortConfig.key];
        }

        // Handle null/undefined values
        if (!aValue) aValue = '';
        if (!bValue) bValue = '';
        
        // Special handling for dates
        if (sortConfig.key === 'appointment_date') {
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
    return sortableAppointments;
  }, [appointments, sortConfig]);

  const filteredAppointments = React.useMemo(() => {
    if (!appointments) return [];
    if (!searchConfig?.term) return sortedAppointments;
    
    return sortedAppointments.filter(appointment => {
      const searchTerm = searchConfig.term.toLowerCase().trim();
      
      const matchesId = appointment.appointment_sn?.toString().toLowerCase().includes(searchTerm);
      const matchesCustomer = appointment.Customer?.customer_name?.toLowerCase().includes(searchTerm);
      const matchesService = appointment.service_type?.toLowerCase().includes(searchTerm);
      const matchesDate = new Date(appointment.appointment_date)?.toLocaleDateString()?.toLowerCase().includes(searchTerm);
      const matchesTime = appointment.time_slot?.toLowerCase().includes(searchTerm);
      const matchesStatus = appointment.status?.toLowerCase().includes(searchTerm);
      
      return matchesId || matchesCustomer || matchesService || matchesDate || matchesTime || matchesStatus;
    });
  }, [appointments, searchConfig, sortedAppointments]);

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

  const handleDeleteData = async (appointment) => {
    if (!appointment?.appointment_id) return;
    
    try {
      const response = await instance.delete(
        `/appointment/${appointment.appointment_id}?username=${username}`
      );
      if (response.data) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error deleting appointment:', error);
    }
  };

  const handleDeleteClick = (appointment) => {
    setSelectedAppointment(appointment);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedAppointment) {
      handleDeleteData(selectedAppointment);
      setDeleteDialogOpen(false);
      setSelectedAppointment(null);
    }
  };

  const handleEditClick = (appointment) => {
    setEditFormData({
      appointment_id: appointment.appointment_id,
      customer_id: appointment.Customer?.customer_id,
      service_type: appointment.service_type,
      appointment_date: appointment.appointment_date,
      time_slot: appointment.time_slot,
      status: appointment.status
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
        `/appointment/appointments/${editFormData.appointment_id}?username=${username}`,
        {
          customer_id: editFormData.customer_id,
          service_type: editFormData.service_type,
          appointment_date: editFormData.appointment_date,
          time_slot: editFormData.time_slot,
          status: editFormData.status
        }
      );

      if (response.data) {
        setEditDialogOpen(false);
        window.location.reload();
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
    }
  };

  if (!appointments) return null;

  return (
    <div className="w-full -mt-4 lg:mt-0">
      {/* Mobile View - Card Layout */}
      <div className="block lg:hidden space-y-4 px-4 max-h-[calc(100vh-15rem)] overflow-y-auto">
        {appointments.length === 0 ? (
          <EmptyState />
        ) : (
          filteredAppointments.map((appointment, index) => (
            <motion.div
              key={appointment.appointment_id}
              className="bg-white rounded-lg shadow-sm p-4 space-y-3 border border-gray-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900">{appointment.Customer?.customer_name}</h3>
                  <p className="text-sm text-gray-500">ID: {appointment.appointment_id}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditClick(appointment)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <FaEdit className="text-gray-500 hover:text-gray-700 w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(appointment)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <FaTrashAlt className="text-red-500 hover:text-red-700 w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider">Service Type</p>
                  <p className="font-medium text-gray-900 truncate">{appointment.service_type}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider">Date</p>
                  <p className="font-medium text-gray-900">{appointment.appointment_date}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider">Time</p>
                  <p className="font-medium text-gray-900">{appointment.time_slot}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider">Status</p>
                  <p className="font-medium text-gray-900">{appointment.status}</p>
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
                    { key: 'appointment_id', label: 'ID' },
                    { key: 'customer_name', label: 'Customer' },
                    { key: 'service_type', label: 'Service Type' },
                    { key: 'appointment_date', label: 'Date' },
                    { key: 'time_slot', label: 'Time' },
                    { key: 'status', label: 'Status' },
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
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan="7">
                      <EmptyState />
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map((appointment, index) => (
                    <motion.tr
                      key={appointment.appointment_id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-3 py-4 text-sm text-gray-900">
                        {appointment.appointment_id}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        {appointment.Customer?.customer_name}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        {appointment.service_type}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        {new Date(appointment.appointment_date).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        {appointment.time_slot}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        {appointment.status}
                      </td>
                      <td className="px-3 py-4 text-right text-sm font-medium sticky right-0 bg-white">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditClick(appointment)}
                            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                          >
                            <FaEdit className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(appointment)}
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
            <AlertDialogTitle>Delete Appointment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this appointment? This action cannot be undone.
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
            <AlertDialogTitle>Edit Appointment</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium text-gray-700 required-field">
                Service Type
              </label>
              <input
                name="service_type"
                value={editFormData.service_type || ''}
                onChange={handleEditFormChange}
                className="col-span-3 p-2 border rounded-md"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium text-gray-700 required-field">
                Date
              </label>
              <input
                type="date"
                name="appointment_date"
                value={editFormData.appointment_date || ''}
                onChange={handleEditFormChange}
                className="col-span-3 p-2 border rounded-md"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium text-gray-700 required-field">
                Time Slot
              </label>
              <input
                name="time_slot"
                value={editFormData.time_slot || ''}
                onChange={handleEditFormChange}
                className="col-span-3 p-2 border rounded-md"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                name="status"
                value={editFormData.status || ''}
                onChange={handleEditFormChange}
                className="col-span-3 p-2 border rounded-md"
              >
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
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
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      <span className="text-lg font-medium text-gray-900">No appointments found</span>
      <p className="text-sm text-gray-500">
        Add a new appointment to get started
      </p>
    </div>
  </div>
);

export default AppointmentTable;