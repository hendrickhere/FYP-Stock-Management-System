import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GlobalContext } from "../globalContext";
import instance from "../axiosConfig";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Alert, AlertDescription } from "../ui/alert";
import { AlertCircle } from "lucide-react";
import Header from "../header";
import { motion } from 'framer-motion';
import { useScrollDirection } from "../useScrollDirection";
import Sidebar from "../sidebar";
import { Search, Plus, Download, Pencil, Trash } from "lucide-react";

const springTransition = {
  type: "spring",
  stiffness: 400,
  damping: 40,
  mass: 0.3,
  restDelta: 0.001,
};

function WarrantyMain() {
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
}

function MainContent({ isMobile, scrollDirection, isAtTop }) {
    const { username } = useContext(GlobalContext);
    const navigate = useNavigate();
    const [warranties, setWarranties] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
  
    const navigateToAddWarranty = () => {
      navigate("add_warranty");
    };
  
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
    }, []);
  
    const getWarrantyTypeLabel = (type) => {
      return type === 1 ? "Consumer Warranty" : "Manufacturer Warranty";
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
            <div className="p-6">
              {/* Header */}
              <div className="mb-6">
                <h1 className="text-xl font-medium">Warranty</h1>
              </div>
  
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
  
              {/* Search and Actions Bar */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search warranty..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
  
                <button 
                  onClick={navigateToAddWarranty} 
                  className="px-4 py-2 bg-emerald-500 text-white rounded-lg flex items-center gap-2"
                >
                  <Plus size={20} />
                  Add Warranty
                </button>
  
                <button className="px-4 py-2 border border-gray-200 rounded-lg flex items-center gap-2">
                  <Download size={20} />
                  Export
                </button>
              </div>
  
              {/* Warranty Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {isLoading ? (
                  <div className="col-span-full flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                ) : warranties.length === 0 ? (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    No warranties found
                  </div>
                ) : (
                  warranties.map((warranty) => (
                    <div
                      key={warranty.warranty_id}
                      className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-lg transition-shadow"
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
                          <span>{getWarrantyTypeLabel(warranty.warranty_type)}</span>
                        </p>
                        <p className="flex justify-between">
                          <span>Duration:</span>
                          <span>{warranty.duration} months</span>
                        </p>
                        <p className="flex justify-between">
                          <span>SKU:</span>
                          <span>{warranty.product.sku_number}</span>
                        </p>
                        <p className="flex justify-between">
                          <span>Stock:</span>
                          <span className="text-emerald-600">
                            {warranty.product.product_stock} units
                          </span>
                        </p>
                      </div>
  
                      {warranty.description && (
                        <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                          {warranty.description}
                        </p>
                      )}
  
                      <div className="flex justify-end gap-2 mt-4">
                        <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded">
                          <Pencil size={18} />
                        </button>
                        <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded">
                          <Trash size={18} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

export default WarrantyMain;
