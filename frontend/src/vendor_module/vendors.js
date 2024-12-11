import React, { useState, useEffect, useContext, useRef } from "react";
import Header from '../header';
import Sidebar from '../sidebar';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosConfig';
import { Plus } from 'lucide-react';
import VendorTable from './vendorTable';
import { GlobalContext } from "../globalContext";
import { useScrollDirection } from '../useScrollDirection';
import { motion } from 'framer-motion';
import VendorSearch from './vendor_search';
import { Button } from "../ui/button";

const springTransition = {
  type: "spring",
  stiffness: 400,
  damping: 40,
  mass: 0.3,
  restDelta: 0.001
};

function Vendors() {
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
        <MainContent isMobile={isMobile} scrollDirection={scrollDirection} isAtTop={isAtTop} />
      </div>
    </div>
  );
}

function MainContent({ isMobile, scrollDirection, isAtTop }) {
  const { username } = useContext(GlobalContext);
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState(null);
  const navigate = useNavigate();
  const [isTopButtonsVisible, setIsTopButtonsVisible] = useState(true);
  const topButtonsRef = useRef(null);
  const [searchConfig, setSearchConfig] = useState({
    term: '',
    activeFilters: ['name', 'contact', 'phone', 'address']
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsTopButtonsVisible(entry.isIntersecting);
      },
      { 
        root: null,
        threshold: 0.1 
      }
    );

    if (topButtonsRef.current) {
      observer.observe(topButtonsRef.current);
    }

    return () => {
      if (topButtonsRef.current) {
        observer.unobserve(topButtonsRef.current);
      }
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/stakeholders/vendors?username=${username}`);
      setVendors(response.data.vendors);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchFilter = (config) => {
    setSearchConfig(config);
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
          <div className="mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <h1 className="text-xl font-medium">Vendors</h1>
              <div className="lg:w-auto lg:ml-20 flex-1">
                <VendorSearch 
                  onFilterChange={handleSearchFilter}
                  initialFilters={{
                    name: true,
                    contact: true,
                    phone: true,
                    address: true
                  }}
                />
              </div>
            </div>
          </div>

          <div ref={topButtonsRef} className="flex flex-row gap-4 mb-6">
            <Button
              variant="default"
              className="flex items-center space-x-2 px-4 py-2 bg-white text-green-700 font-medium rounded-lg shadow hover:bg-green-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75"
              onClick={() => navigate('/vendors/add_vendor')}
            >
                <Plus className="w-4 h-4 mr-2" />
              Add Vendor
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <p>Loading...</p>
            </div>
          ) : (
            <VendorTable
              vendors={vendors}
              searchConfig={searchConfig}
            />
          )}
        </motion.div>
      </div>

      {isMobile && !isTopButtonsVisible && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={springTransition}
          onClick={() => navigate('/vendors/add_vendor')}
          className="fixed bottom-6 right-6 w-14 h-14 bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-green-700 transition-colors z-50"
        >
          <Plus className="w-6 h-6" />
        </motion.button>
      )}
    </div>
  );
}

export default Vendors;