import React, { useState, useEffect, useContext } from "react";
import Header from '../header';
import Sidebar from '../sidebar';
import axiosInstance from '../axiosConfig';
import StaffTable from './staffTable';
import { GlobalContext } from "../globalContext";
import { useScrollDirection } from '../useScrollDirection';
import { motion } from 'framer-motion';
import StaffSearch from './staffSearch';
import { useToast } from '../ui/use-toast';
import { FaLock } from 'react-icons/fa';

const springTransition = {
  type: "spring",
  stiffness: 400,
  damping: 40,
  mass: 0.3,
  restDelta: 0.001
};

function Staff() {
  const userRole = JSON.parse(sessionStorage.getItem('userData'))?.role;
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const { scrollDirection, isAtTop } = useScrollDirection();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return (
    <div className="flex flex-col h-screen w-full">
      <Header scrollDirection={scrollDirection} isAtTop={isAtTop} /> 
      <div className="flex flex-row flex-grow">
        <Sidebar scrollDirection={scrollDirection} isAtTop={isAtTop} />
          {userRole === 'Staff' ? (
            // Restricted Access Content
            <div className="flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto">
                <motion.div 
                  className="p-6 h-full"
                  animate={{ 
                    marginLeft: isMobile ? '0' : (scrollDirection === 'down' && !isAtTop ? '4rem' : '13rem'),
                  }}
                  transition={springTransition}
                >
                  <div className="flex items-center justify-center h-full">
                    <motion.div 
                      className="text-center"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="bg-white/50 rounded-lg p-8">
                        <FaLock className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Restricted</h2>
                        <p className="text-gray-600 max-w-md">
                          You don't have permission to view this page. This section is only accessible to managers.
                        </p>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </div>
          ) : (
            <MainContent 
              isMobile={isMobile} 
              scrollDirection={scrollDirection} 
              isAtTop={isAtTop} 
            />
          )}
      </div>
    </div>
  );
}

function MainContent({ isMobile, scrollDirection, isAtTop }) {
  const { username } = useContext(GlobalContext);
  const [loading, setLoading] = useState(false);
  const [staffMembers, setStaffMembers] = useState(null);
  const [searchConfig, setSearchConfig] = useState({
    term: '',
    activeFilters: ['username', 'email', 'role']
  });
  const { toast } = useToast();

  // Fetch staff data when component mounts
  useEffect(() => {
    fetchStaffData();
  }, [username]);

  // Function to fetch staff data
  const fetchStaffData = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/staff/staffs`, {
        params: { username }
      });

      if (response.data.success) {
        setStaffMembers(response.data.staffMembers);
      } else {
        toast({
          title: "Error",
          description: response.data.message || "Failed to fetch staff data",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error fetching staff data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch staff data",
        variant: "destructive"
      });
      setStaffMembers([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle search filter changes
  const handleSearchFilter = async (config) => {
    setSearchConfig(config);
    try {
      setLoading(true);
      // Changed from /staff/staffs/search to /staffs/search
      const response = await axiosInstance.post(`/staff/staffs/search`, 
        { term: config.term },
        { params: { username } }
      );

      if (response.data.success) {
        setStaffMembers(response.data.staffMembers);
      } else {
        toast({
          title: "Error",
          description: response.data.message || "Failed to search staff",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error searching staff:", error);
      toast({
        title: "Error",
        description: "Failed to search staff",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStaffDeleted = () => {
    // Refresh the staff list
    fetchStaffData();
  };

  return (
    <div className="flex-1 overflow-hidden">
      <div className="h-full overflow-y-auto">
        <motion.div 
          className="p-6"
          animate={{ 
            marginLeft: isMobile ? '0' : (scrollDirection === 'down' && !isAtTop ? '4rem' : '13rem'),
          }}
          transition={springTransition}
        >
          {/* Title and Search Section */}
          <div className="mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <h1 className="text-2xl font-bold">Staffs</h1>
              <div className="lg:w-auto lg:ml-20 flex-1">
                <StaffSearch 
                  onFilterChange={handleSearchFilter}
                  initialFilters={{
                    username: true,
                    email: true,
                    role: true
                  }}
                />
              </div>
            </div>
          </div>

          {/* Content Area */}
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <p>Loading...</p>
            </div>
          ) : (
            <StaffTable
              staffs={staffMembers}
              searchConfig={searchConfig}
              onStaffDeleted={handleStaffDeleted}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default Staff;