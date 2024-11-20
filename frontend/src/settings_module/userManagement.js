import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUsersCog } from "react-icons/fa";
import { Alert, AlertDescription } from "../ui/alert";
import { PlusCircle } from 'lucide-react';

function UserManagement() {
  const [userData] = useState(() => {
    const cached = sessionStorage.getItem('userData');
    return cached ? JSON.parse(cached) : null;
  });
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!userData || userData.role !== 'admin') {
      navigate('/settings');
      return;
    }
  }, [userData, navigate]);

  if (!userData || userData.role !== 'admin') {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          You don't have permission to access this page.
        </AlertDescription>
      </Alert>
    );
  }

  // Sample user data - replace with actual data
  const users = [
    { id: 1, name: 'John Doe', role: 'Manager', status: 'active' },
    { id: 2, name: 'Jane Smith', role: 'Staff', status: 'active' },
    { id: 3, name: 'Bob Johnson', role: 'Staff', status: 'inactive' },
    // Add more sample users as needed
  ];

  return (
    <div className="w-full h-[calc(100vh-8rem)] overflow-y-auto">
      <div className="min-h-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <FaUsersCog className="w-6 h-6 mr-2" />
            <h1 className="text-2xl font-bold">User Management</h1>
          </div>
          <button 
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[#38304C] rounded-md hover:bg-[#2A2338] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#38304C]"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Add User
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* Filters and Search Section */}
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <select className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                <option>All Roles</option>
                <option>Admin</option>
                <option>Manager</option>
                <option>Staff</option>
              </select>
              <select className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                <option>All Status</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Search users..."
                className="w-full md:w-64 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* User Table */}
          <div className="overflow-x-auto">
            <div className="min-w-full align-middle">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Name
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Role
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Status
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Last Active
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {user.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {user.role}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            user.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          2 hours ago
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button className="text-indigo-600 hover:text-indigo-900 mr-4">
                            Edit
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4">
            <div className="flex flex-1 justify-between sm:hidden">
              <button className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Previous
              </button>
              <button className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Next
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">1</span> to <span className="font-medium">10</span> of{' '}
                  <span className="font-medium">20</span> results
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0">
                    Previous
                  </button>
                  <button className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0">
                    1
                  </button>
                  <button className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0">
                    2
                  </button>
                  <button className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0">
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6 space-x-3">
          <button 
            onClick={() => navigate('/settings')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Back to Settings
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserManagement;