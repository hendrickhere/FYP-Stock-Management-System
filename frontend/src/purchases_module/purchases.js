import React, { useState, useEffect, useContext } from "react";
import Header from "../header";
import Sidebar from "../sidebar";
import { useNavigate } from 'react-router-dom';
import { GlobalContext } from "../globalContext";
import axiosInstance from '../axiosConfig';
import PurchaseTable from './purchaseTable';
import { useScrollDirection } from '../useScrollDirection';
import { motion } from 'framer-motion';
import PurchasesActionBar from "./purchasesActionBar";
import PurchasesSearch from "./purchasesSearchBar";

const springTransition = {
  type: "spring",
  stiffness: 400,
  damping: 40,
  mass: 0.3
};

function Purchases() {
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

const MainContent = ({ isMobile, scrollDirection, isAtTop }) => {
  const { username } = useContext(GlobalContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const navigation = useNavigate();
  const [highlightSelections, setHighlightSelections] = useState(false);
  const [searchConfig, setSearchConfig] = useState({ term: '', activeFilters: [] });

  const filterPurchaseOrders = (orders, searchConfig) => {
  if (!searchConfig?.term || !orders) return orders;
  
  const searchTerm = searchConfig.term.toLowerCase().trim();
  const activeFilters = searchConfig.activeFilters || [];
  
  return orders.filter(order => {
    return activeFilters.some(filter => {
      switch (filter) {
        case 'purchaseOrderId':
          return order.purchase_order_id.toString().toLowerCase().includes(searchTerm);
        case 'vendorName':
          return order.Vendor?.vendor_name?.toLowerCase().includes(searchTerm);
        case 'orderDate':
          return order.order_date?.toLowerCase().includes(searchTerm);
        case 'deliveredDate':
          return order.delivered_date?.toLowerCase().includes(searchTerm);
        case 'totalAmount':
          return order.total_amount?.toString().toLowerCase().includes(searchTerm);
        // Add other cases for remaining filters
        default:
          return false;
      }
    });
  });
};

  const filteredData = React.useMemo(() => ({
    ...data,
    purchases: data?.purchases ? filterPurchaseOrders(data.purchases, searchConfig) : []
  }), [data, searchConfig]);

  async function fetchPurchases() {
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        `/purchases/${username}`
      );
      setData(response.data);
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      setData({ purchases: [] });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPurchases();
  }, []);

  const handleDeleteData = async (index) => {
    const confirm = window.confirm("Are you sure you want to delete this purchase order?");
    if (confirm) {
      try {
        await axiosInstance.put(
          `/user/${username}/${data.purchases[index].purchase_order_id}/delete`
        );
        window.alert("Purchase Order successfully deleted");
        fetchPurchases();
      } catch (error) {
        console.error('Error deleting purchase order:', error);
      }
    }
  };

  const handleEditData = (index) => {
    navigation('add_purchases', {
      state: {
        purchaseOrderId: data.purchases[index].purchase_order_id,
        isAdd: false
      }
    });
  };

  const navigateToAddPurchasePage = () => {
    navigation('/purchases/add_purchases', { state: { isAdd: true } });
  };

  const handleManageTax = () => {
  // TODO: Implement tax management
  console.log('Managing tax...');
  };

  const handleRecordExpenses = () => {
  // TODO: Implement expense recording
  console.log('Recording expenses...');
  };

  const handleCreateBill = (type) => {
  // TODO: Implement bill creation
  console.log('Creating', type);
  };

  return (
    <div className="flex-1 h-[calc(100vh-4rem)]">
      <div className="h-full overflow-y-auto custom-scrollbar">
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
              <h1 className="text-xl font-medium">Purchase Orders</h1>
              <div className="lg:ml-20 flex-1">
                <PurchasesSearch
                  onFilterChange={setSearchConfig}
                  initialFilters={{
                    purchaseOrderId: true,
                    vendorName: true,
                    orderDate: true,
                    deliveredDate: true,
                    totalAmount: true
                  }}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
            <PurchasesActionBar 
              selectedOrders={selectedOrders}
              onCreateNew={navigateToAddPurchasePage}
              onManageTax={handleManageTax}
              onRecordExpenses={handleRecordExpenses}
              onCreateBill={handleCreateBill}
              onHighlightSelections={(highlight) => {
                // TODO: Implement highlight logic similar to sales
                console.log('Highlighting selections:', highlight);
              }}
            />

          {/* Content Area */}
          <div className="mt-4">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <p>Loading...</p>
              </div>
            ) : (
              <PurchaseTable 
                purchases={data}
                selectedOrders={selectedOrders}
                onSelectionChange={setSelectedOrders}
                handleDeleteData={handleDeleteData}
                username={username}
                highlightSelections={highlightSelections}
                setHighlightSelections={setHighlightSelections}
                userRole="Manager" 
              />
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Purchases;