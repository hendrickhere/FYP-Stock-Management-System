import React from 'react';
import { FaTrashAlt, FaEdit, FaEllipsisV } from 'react-icons/fa';

const AppointmentTable = ({ appointments, handleDeleteData, handleEditData }) => {
  if (!appointments) return null;
  
  return (
    <div className="container mr-auto ml-0 p-4 flex flex-col">
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300 rounded-lg shadow-md">
          <thead>
            <tr className="border-b">
              <th className="px-4 py-2 text-left"> </th>
              <th className="px-4 py-2 text-left">Appointment ID</th>
              <th className="px-4 py-2 text-left">Customer Name</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Phone Number</th>
              <th className="px-4 py-2 text-left">Service Type</th>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Time Slot</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left"> </th>
            </tr>
          </thead>
          <tbody>
            {appointments.length === 0 ? (
              <tr>
                <td colSpan="12" className="px-4 py-8 text-center text-gray-500 bg-gray-50">
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
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                      />
                    </svg>
                    <span className="text-lg font-medium">No appointments found</span>
                    <p className="text-sm text-gray-500">
                      Add a new appointment to get started
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              appointments.map((appointment, index) => (
                <tr key={appointment.appointment_id} className="border-b hover:bg-gray-100">
                  <td className="px-4 py-2"><input type="radio" name="selectedAppointment" /></td>
                  <td className="px-4 py-2">{appointment.appointment_id}</td>
                  <td className="px-4 py-2">{appointment.Customer.customer_name}</td>
                  <td className="px-4 py-2">{appointment.Customer.customer_email}</td>
                  <td className="px-4 py-2">{appointment.Customer.customer_contact}</td>
                  <td className="px-4 py-2">{appointment.service_type}</td>
                  <td className="px-4 py-2">{appointment.appointment_date}</td>
                  <td className="px-4 py-2">{appointment.time_slot}</td>
                  <td className="px-4 py-2">{appointment.status}</td>
                  <td className="px-4 py-2 flex gap-2">
                    <FaEdit 
                      className="text-gray-500 hover:text-gray-700 cursor-pointer" 
                      onClick={() => handleEditData(index)} 
                    />
                    <FaTrashAlt 
                      className="text-red-500 hover:text-red-700 cursor-pointer" 
                      onClick={() => handleDeleteData(index)}
                    />
                    <FaEllipsisV 
                      className="text-gray-500 hover:text-gray-700 cursor-pointer" 
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AppointmentTable;