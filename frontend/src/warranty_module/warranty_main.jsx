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
  const navigateToAddWarranty = () => {
    navigate("add_warranty");
  };
  const [warranties, setWarranties] = useState([
    {
      id: 1,
      type: "MANUFACTURER",
      name: "Basic Manufacturer Coverage",
      warrantyId: "MFW-2024-001",
      productCategories: ["Laptops", "Desktops"],
      duration: 12,
      registeredUnits: 1994,
    },
    {
      id: 2,
      type: "CONSUMER",
      name: "Extended Consumer Protection",
      warrantyId: "CW-2024-002",
      productCategories: ["Electronics"],
      duration: 24,
      registeredUnits: 4939,
    },
  ]);

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

          {/* Search and Actions Bar */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-2.5 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search warranty..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <div className="absolute right-3 top-2.5">
                <span className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  0
                </span>
              </div>
            </div>

            <button onClick={() => navigateToAddWarranty()} className="px-4 py-2 bg-emerald-500 text-white rounded-lg flex items-center gap-2">
              <Plus size={20} />
              Add Warranty
            </button>

            <button className="px-4 py-2 border border-gray-200 rounded-lg flex items-center gap-2">
              <Download size={20} />
              Export
            </button>
          </div>

          {/* Sort Bar */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center text-gray-500">
              <span className="mr-2">Sort by:</span>
              <select className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none">
                <option>Sort by...</option>
                <option>Name</option>
                <option>Type</option>
                <option>Duration</option>
                <option>Registered Units</option>
              </select>
            </div>
          </div>

          {/* Warranty Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {warranties.map((warranty) => (
              <div
                key={warranty.id}
                className="bg-white rounded-lg p-4 border border-gray-200"
              >
                <div className="text-4xl text-gray-300 mb-4">
                  {warranty.type === "MANUFACTURER" ? "M" : "C"}
                </div>
                <h3 className="font-medium mb-2">{warranty.name}</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>ID: {warranty.warrantyId}</p>
                  <p>Covers: {warranty.productCategories.join(', ')}</p>
                  <p className="flex justify-between">
                    <span>Duration: {warranty.duration} months</span>
                    <span className="text-emerald-600">
                      {warranty.registeredUnits} registered
                    </span>
                  </p>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded">
                    <Pencil size={18} />
                  </button>
                  <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded">
                    <Trash size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        </motion.div>
      </div>
    </div>
  );
}

export default WarrantyMain;
