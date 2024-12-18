import React, {useState, useEffect, useContext, useRef, useCallback, useMemo, useLayoutEffect} from "react";
import Header from '../header';
import Sidebar from '../sidebar';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosConfig';
import { GlobalContext } from "../globalContext";
import InventoryLayout from "./inventoryCardLayout";
import { CiExport } from "react-icons/ci";
import ProductDetailModal from './inventoryDetailModal';
import InventorySearch from "./inventorySearch";
import { useScrollDirection } from '../useScrollDirection';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "../ui/button";
import { Plus } from 'lucide-react';
import { toast } from "../ui/use-toast";

const syncedTransition = {
  type: "spring",
  stiffness: 300, 
  damping: 30,
  delay: 0,       
  duration: 0.3,  
};

function Inventory() {
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
        <MainContent isMobile={isMobile} />
      </div>
    </div>
  );
}

function MainContent({ isMobile }) {
  const { username } = useContext(GlobalContext);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState();
  const navigate = useNavigate();
  const [filter, setFilter] = useState("");
  const [render, setRender] = useState("false");
  const { scrollDirection, isAtTop } = useScrollDirection();
  const [isTopButtonsVisible, setIsTopButtonsVisible] = useState(true);
  const topButtonsRef = useRef(null);

  const [immediateScrollDirection, setImmediateScrollDirection] = useState(scrollDirection);

  useLayoutEffect(() => {
    setImmediateScrollDirection(scrollDirection); 
  }, [scrollDirection]);

  const [searchConfig, setSearchConfig] = useState({
    term: "",
    activeFilters: [],
  });

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const filterInventory = useCallback((inventory, searchConfig) => {
    if (!searchConfig?.term || !inventory?.inventories)
      return inventory?.inventories;

    const searchTerm = searchConfig.term.toLowerCase().trim();
    const activeFilters = searchConfig.activeFilters || [];

    return inventory.inventories.filter((product) => {
      const safeCheck = (value) => {
        if (value === null || value === undefined) return false;
        return value.toString().toLowerCase().includes(searchTerm);
      };

      return activeFilters.some((filter) => {
        switch (filter) {
          case "productName":
            return safeCheck(product.product_name);
          case "skuNumber":
            return safeCheck(product.sku_number);
          case "brand":
            return safeCheck(product.brand);
          case "manufacturer":
            return safeCheck(product.manufacturer);
          case "price":
            return safeCheck(product.price);
          case "stock":
            return safeCheck(product.product_stock);
          case "expiryDate":
            return (
              product.is_expiry_goods &&
              product.expiry_date &&
              safeCheck(new Date(product.expiry_date).toLocaleDateString())
            );
          case "dimensions":
            return safeCheck(product.dimensions);
          case "weight":
            return safeCheck(product.weight);
          case "unit":
            return safeCheck(product.unit);
          default:
            return false;
        }
      });
    });
  }, []);

  const filteredData = useMemo(
    () => ({
      ...data,
      inventories: data?.inventories ? filterInventory(data, searchConfig) : [],
    }),
    [data, searchConfig, filterInventory]
  );

  const handleProductSelect = (product, isEdit = false) => {
    setSelectedProduct(product);
    setIsEditMode(isEdit);
    setIsModalOpen(true);
  };

  const handleProductUpdate = (updatedProduct) => {
    setData((prevData) => ({
      ...prevData,
      inventories: prevData.inventories.map((product) =>
        product.product_uuid === updatedProduct.product_uuid
          ? updatedProduct
          : product
      ),
    }));
  };

  async function fetchInventories() {
    await axiosInstance
      .get(`http://localhost:3002/api/user/${username}/inventories`)
      .then((response) => {
        setData(() => response.data);
        console.log(`response is here! + ${response.data}`);
        setLoading(() => false);
      });
  }

  async function deleteInventory(productUUID) {
    try {
      await axiosInstance.put(
        `http://localhost:3002/api/user/${username}/${productUUID}/delete`
      );
      // Update local state to remove the deleted item
      setData((prevData) => ({
        ...prevData,
        inventories: prevData.inventories.filter(
          (item) => item.product_uuid !== productUUID
        ),
      }));
      toast({
        description: "Product deleted successfully",
      });
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        description: "Failed to delete product",
        variant: "destructive",
      });
    }
  }

  useEffect(() => {
    fetchInventories();
  }, [render]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsTopButtonsVisible(entry.isIntersecting);
      },
      {
        root: null,
        threshold: 0.1,
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

  function handleEditData(index) {
    navigate("/inventory/add_inventory", {
      state: {
        inventoryuuid: data.inventories[index].product_uuid,
        isAdd: false,
      },
    });
  }

  function handleDeleteData(productUUID) {
    deleteInventory(productUUID);
  }

  function handleFilterChange(event) {
    setFilter(() => event.target.value);
  }

  function navigateToAddProductPage() {
    navigate("/inventory/add_inventory", {
      state: {
        inventoryuuid: "",
        isAdd: true,
      },
    });
  }

  return (
    <main className="flex-1">
      <div
        className={`scroll-container h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar ${
          isMobile ? "w-full" : ""
        }`}
      >
        <motion.div
          className="p-6"
          animate={{
            marginLeft: isMobile
              ? "0"
              : scrollDirection === "down" && !isAtTop
              ? "4rem"
              : "13rem",
            marginTop: scrollDirection === "down" && !isAtTop ? "0" : "0",
          }}
          transition={syncedTransition}

        >
          {/* Title and Search Section */}
          <motion.div
            className="mb-6"
            animate={{
              opacity: scrollDirection === "down" && !isAtTop ? 0 : 1,
              y: scrollDirection === "down" && !isAtTop ? -20 : 0,
            }}
            transition={syncedTransition}
          >
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <h1 className="text-xl font-medium">Inventory</h1>
              <div className="lg:w-auto lg:ml-20 flex-1">
                <InventorySearch
                  onFilterChange={setSearchConfig}
                  initialFilters={{
                    productName: true,
                    skuNumber: true,
                    brand: true,
                    stock: true,
                    price: true,
                  }}
                />
              </div>
            </div>
          </motion.div>

          {/* Buttons Section */}
          <motion.div
            ref={topButtonsRef}
            className="flex flex-row gap-4 mb-6"
            animate={{
              opacity: scrollDirection === "down" && !isAtTop ? 0 : 1,
              y: scrollDirection === "down" && !isAtTop ? -20 : 0,
            }}
            transition={syncedTransition}

          >
            <Button
              variant="default"
              className="flex items-center space-x-2 px-4 py-2 bg-white text-green-700 font-medium rounded-lg shadow hover:bg-green-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75"
              onClick={navigateToAddProductPage}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>

            <button className="inline-flex items-center justify-center px-4 py-2 bg-white font-medium rounded-lg shadow">
              <CiExport className="w-5 h-5 mr-2" />
              Export
            </button>
          </motion.div>

          {/* Content Area */}
          <motion.div
            className="bg-white rounded-lg shadow-sm overflow-hidden" // Added overflow-hidden
            animate={{
              width: isMobile
                ? "100%"
                : scrollDirection === "down" && !isAtTop
                ? "calc(100vw - 8rem)"  
                : "calc(100vw - 17rem)",
            }}
            transition={syncedTransition}
          >
            <div className="p-4"> {/* Changed from motion.div to regular div */}
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <p>Loading...</p>
                </div>
              ) : (
                // Remove the motion.div with grid-container class and its width animation
                <div className="w-full">
                  <InventoryLayout
                    products={filteredData}
                    handleDeleteData={handleDeleteData}
                    handleEditData={handleEditData}
                    onProductSelect={handleProductSelect}
                    isLoading={loading}
                  />
                  {selectedProduct && (
                    <ProductDetailModal
                      isOpen={isModalOpen}
                      onClose={() => {
                        setIsModalOpen(false);
                        setSelectedProduct(null);
                      }}
                      product={selectedProduct}
                      index={data?.inventories?.findIndex(
                        (p) => p.product_uuid === selectedProduct.product_uuid
                      )}
                      handleEditData={handleEditData}
                      handleDeleteData={handleDeleteData}
                      username={username}
                      onProductUpdate={handleProductUpdate}
                    />
                  )}
                </div>
              )}
            </div>
          </motion.div>
      </motion.div>
    </div>

      {/* Floating Action Button */}
      {!isTopButtonsVisible && !isAtTop && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={syncedTransition}
          onClick={navigateToAddProductPage}
          className="fixed bottom-6 right-6 w-14 h-14 bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-green-700 transition-colors z-50"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
        </motion.button>
      )}
    </main>
  );
}

export default Inventory;