import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GlobalContext } from "../globalContext";
import instance from "../axiosConfig";
import { Card } from "../ui/card";
import { Alert, AlertDescription } from "../ui/alert";
import { AlertCircle, Search, Plus, Download } from "lucide-react";
import Header from "../header";
import { motion } from 'framer-motion';
import { useScrollDirection } from "../useScrollDirection";
import Sidebar from "../sidebar";
import { Button } from "../ui/button";
import WarrantySearch from './warranty_search'; 

const springTransition = {
  type: "spring",
  stiffness: 400,
  damping: 40,
  mass: 0.3,
  restDelta: 0.001,
};

export const MainContent = ({ isMobile, scrollDirection, isAtTop }) => {
  const { username } = useContext(GlobalContext);
  const [warranties, setWarranties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [searchConfig, setSearchConfig] = useState({
    term: '',
    activeFilters: ['id', 'product', 'type', 'duration', 'status']
  });

  const fetchWarranties = async () => {
    try {
      setIsLoading(true);
      const response = await instance.get(`/warranties/active?username=${username}`);
      setWarranties(response.data.warranties);
    } catch (err) {
      setError('Failed to load warranties');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWarranties();
  }, [username]); // Added username to dependency array

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
          {/* Title and Search Section */}
          <div className="mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <h1 className="text-xl font-medium">Warranty Management</h1>
              <div className="lg:w-auto lg:ml-20 flex-1">
                <WarrantySearch
                  onFilterChange={handleSearchFilter}
                  initialFilters={{
                    id: true,
                    product: true,
                    type: true,
                    duration: true,
                    status: true
                  }}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-row gap-4 mb-6">
            <Button
              variant="default"
              className="flex items-center space-x-2 px-4 py-2 bg-white text-green-700 font-medium rounded-lg shadow hover:bg-green-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75"
              onClick={() => navigate('/warranty/add_warranty')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Warranty
            </Button>
            <Button
              variant="outline"
              className="flex items-center space-x-2"
              onClick={() => {/* Implement export functionality */}}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          {/* Warranty Grid with Loading and Error States */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : warranties.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No warranties found
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {warranties.map((warranty) => (
                <Card
                  key={warranty.warranty_id}
                  className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-xl transition-shadow duration-200"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="text-3xl font-bold text-gray-300">
                      {warranty.warranty_type === 1 ? "C" : "M"}
                    </div>
                    <span className="text-sm text-gray-500">
                      ID: {warranty.warranty_id}
                    </span>
                  </div>

                  <h3 className="font-medium mb-2 line-clamp-2">
                    {warranty.product.product_name}
                  </h3>

                  <div className="text-sm text-gray-600 space-y-2">
                    <p className="flex justify-between">
                      <span>Type:</span>
                      <span>
                        {warranty.warranty_type === 1 ? "Consumer" : "Manufacturer"}
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span>Duration:</span>
                      <span>{warranty.duration} months</span>
                    </p>
                    <p className="flex justify-between">
                      <span>SKU:</span>
                      <span>{warranty.product.sku_number}</span>
                    </p>
                  </div>

                  <div className="mt-4 flex justify-end gap-2">
                    <button 
                      onClick={() => navigate(`/warranty/edit/${warranty.warranty_id}`)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => {/* Implement delete handler */}}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                    >
                      Delete
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

// Main WarrantyMain component
const WarrantyMain = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const { scrollDirection, isAtTop } = useScrollDirection();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex flex-col h-screen w-full">
      <Header scrollDirection={scrollDirection} isAtTop={isAtTop} />
      <div className="flex flex-row flex-grow">
        <Sidebar scrollDirection={scrollDirection} isAtTop={isAtTop} />
        <MainContent
          isMobile={isMobile}
          scrollDirection={scrollDirection}
          isAtTop={isAtTop}
        />
      </div>
    </div>
  );
};

export default WarrantyMain;