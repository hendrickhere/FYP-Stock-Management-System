import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUsersCog } from "react-icons/fa";
import { Alert, AlertDescription } from "../ui/alert";
import { PlusCircle, Search, AlertCircle, Save, Ban, RefreshCw } from 'lucide-react';
import { GlobalContext } from '../globalContext';
import Header from '../header';
import Sidebar from '../sidebar';
import instance from '../axiosConfig';

function UserManagement() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden">
      <Header />
      <div className="flex flex-row flex-grow overflow-hidden">
        <Sidebar />
        <MainContent isMobile={isMobile} />
      </div>
    </div>
  );
}

const MainContent = ({ isMobile }) => {
  const navigate = useNavigate();
  const { organizationId } = useContext(GlobalContext);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [userData] = useState(() => {
    const cached = sessionStorage.getItem('userData');
    return cached ? JSON.parse(cached) : null;
  });

  // Fetch users (simulated - replace with actual API call)
  const fetchUsers = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }

      // Replace with actual API call
      const mockUsers = [
        { id: 1, name: 'John Doe', role: 'Manager', status: 'active', lastActive: '2 hours ago' },
        { id: 2, name: 'Jane Smith', role: 'Staff', status: 'active', lastActive: '1 day ago' },
        { id: 3, name: 'Bob Johnson', role: 'Staff', status: 'inactive', lastActive: '5 days ago' },
      ];
      
      setUsers(mockUsers);
      setApiError(null);
    } catch (error) {
      setApiError("Failed to load users. Please try again later.");
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
      if (showRefresh) {
        setIsRefreshing(false);
      }
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [organizationId]);

  const handleRefresh = () => {
    fetchUsers(true);
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!userData || userData.role !== 'admin') {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          You don't have permission to access this page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <main className="flex-1 min-w-0">
      <div className="h-[calc(100vh-4rem)] overflow-y-auto overflow-x-hidden custom-scrollbar">
        <div className={`${isMobile ? "space-y-1" : "ml-[13rem]"}`}>
          <div className="p-6 space-y-6">
            {/* Title Section */}
            <div className="mb-8">
              <div className="flex items-center">
                <FaUsersCog className="w-6 h-6 mr-2 text-gray-700 flex-shrink-0" />
                <h1 className="text-2xl font-bold text-gray-900 truncate">User Management</h1>
              </div>
              <p className="text-gray-600 mt-1 truncate">Manage user access and permissions</p>
            </div>

            {/* Error Alert */}
            {apiError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{apiError}</AlertDescription>
              </Alert>
            )}

            {/* Main Content Section */}
            <div className="bg-white rounded-xl shadow-sm">
              {/* Filters Header */}
              <div className="p-4 md:p-6 border-b border-gray-200">
                <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
                  <div className="w-full sm:w-auto order-2 sm:order-1">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                      <div className="relative flex-1 sm:flex-initial">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="Search users..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full sm:w-64 pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#38304C] focus:border-transparent"
                        />
                      </div>
                      <select className="rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-[#38304C]">
                        <option>All Roles</option>
                        <option>Admin</option>
                        <option>Manager</option>
                        <option>Staff</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 order-1 sm:order-2">
                    <button
                      onClick={handleRefresh}
                      className={`p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors ${
                        isRefreshing ? "animate-spin" : ""
                      }`}
                      disabled={isRefreshing}
                    >
                      <RefreshCw className="w-5 h-5" />
                    </button>
                    <button 
                      className="flex items-center px-4 py-2 text-white bg-primary hover:bg-primary/90 rounded-md shadow-sm"
                    >
                      <PlusCircle className="w-5 h-5 mr-2" />
                      Add User
                    </button>
                  </div>
                </div>
              </div>

              {/* Table Section */}
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Active
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-4">
                          <div className="flex justify-center items-center space-x-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                            <span>Loading users...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                          {searchTerm ? "No matching users found" : "No users available"}
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{user.role}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{user.lastActive}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button className="text-primary hover:text-primary/90 mr-4">Edit</button>
                            <button className="text-red-600 hover:text-red-900">Delete</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Action Button */}
      <div className={`fixed bottom-0 right-0 bg-white border-t border-gray-200 p-4 ${isMobile ? "w-full" : "left-[13rem]"}`}>
        <div className="max-w-7xl mx-auto flex justify-end">
          <button
            onClick={() => navigate("/settings")}
            className="inline-flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <Ban className="w-4 h-4 mr-2" />
            Back to Settings
          </button>
        </div>
      </div>
    </main>
  );
};

export default UserManagement;