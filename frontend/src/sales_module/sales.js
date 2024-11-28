import React, { useState, useEffect, useContext, useRef } from "react";
import Header from "../header";
import Sidebar from "../sidebar";
import { useNavigate } from 'react-router-dom';
import { GlobalContext } from "../globalContext";
import axiosInstance from '../axiosConfig';
import SalesTable from './salesOrderTable';
import SalesActionBar from "./salesActionBar";
import { FileText, FileSpreadsheet, Receipt, RotateCcw, Plus } from 'lucide-react';
import { useScrollDirection } from '../useScrollDirection';
import { motion } from 'framer-motion';
import SalesOrderSearch from './salesOrderSearch';

const springTransition = {
  type: "spring",
  stiffness: 400,
  damping: 40,
  mass: 0.3,
  restDelta: 0.001
};

function Sales() {
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
  const {username} = useContext(GlobalContext);
  const [filter, setFilter] = useState("");
  const [render, setRender] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigate();
  const topButtonsRef = useRef(null);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [searchConfig, setSearchConfig] = useState({ term: '', activeFilters: [] });
  const [highlightSelections, setHighlightSelections] = useState(false);

  const filterSalesOrders = (orders, searchConfig) => {
    if (!searchConfig?.term || !orders) return orders;
    
    const searchTerm = searchConfig.term.toLowerCase().trim();
    const activeFilters = searchConfig.activeFilters || [];
    
    return orders.filter(order => {
      // Helper function to safely check nested properties
      const safeCheck = (value) => {
        if (value === null || value === undefined) return false;
        return value.toString().toLowerCase().includes(searchTerm);
      };

      // Check each applicable filter
      return activeFilters.some(filter => {
        switch (filter) {
          case 'orderId':
            return safeCheck(order.sales_order_uuid);
          case 'customerName':
            return safeCheck(order.Customer?.customer_name);
          case 'orderDate':
            return safeCheck(order.order_date_time);
          case 'shipmentDate':
            return safeCheck(order.expected_shipment_date);
          case 'totalPrice':
            return safeCheck(order.total_price);
          case 'deliveryMethod':
            return safeCheck(order.delivery_method);
          case 'paymentTerms':
            return safeCheck(order.payment_terms);
          case 'status':
            return safeCheck(order.status_id);
          default:
            return false;
        }
      });
    });
  };

  const filteredData = React.useMemo(() => ({
    ...data,
    salesOrders: data?.salesOrders ? filterSalesOrders(data.salesOrders, searchConfig) : []
  }), [data, searchConfig]);
  const [pageNumber, setPageNumber] = useState(1); 
  const [pageSize, setPageSize] = useState(10);

  // Document generation handlers
  const handleGenerateInvoice = async () => {
    console.log('Generating invoice for orders:', selectedOrders);
    // TODO: Implement invoice generation logic
  };

  const handleGenerateQuotation = async () => {
    console.log('Generating quotation for orders:', selectedOrders);
    // TODO: Implement quotation generation logic
  };

  const handleGenerateReceipt = async () => {
    console.log('Generating receipt for orders:', selectedOrders);
    // TODO: Implement receipt generation logic
  };

  const handleReturnProduct = () => {
    if (selectedOrders.length === 1) {
      console.log('Processing return for order:', selectedOrders[0]);
      // TODO: Implement return product logic
    }
  };

  const handleDeleteData = async (salesOrderUUID, managerPassword) => {
    try {
      await axiosInstance.delete(`http://localhost:3002/api/user/${username}/salesOrder/${salesOrderUUID}`, {
        data: { managerPassword } // Send password in request body
      });
      
      // Refresh the sales orders list
      fetchSalesOrder(pageNumber);
    } catch (error) {
      console.error('Error deleting sales order:', error);
      throw error; // Throw error so it can be caught by the table component
    }
  };

  const handleEditData = (order) => {
    navigation(`/sales/edit_sales/${order.sales_order_uuid}`);
  };

  const handleHighlightSelections = (highlight) => {
  setHighlightSelections(highlight);
  };

  function handleFilterChange(event) {
    setFilter(() => event.target.value);
  }

  function navigateToAddSalesPage(){
    navigation("/sales/add_sales");
  }

  useEffect(() => {
    fetchSalesOrder(pageNumber);
  }, [render]);

  async function fetchSalesOrder(pageNumber) {
    try {
      setLoading(true);
      const encodedUsername = encodeURIComponent(username);
      const response = await axiosInstance.get(`http://localhost:3002/api/sales/${username}/salesOrders?pageNumber=${pageNumber}`);
      
      if (response.data && Array.isArray(response.data.salesOrders)) {
        setData(response.data);
      } else {
        setData({ salesOrders: [] });
      }
    } catch (error) {
      console.error('Error fetching sales orders:', error);
      setData({ salesOrders: [] });
    } finally {
      setLoading(false);
    }
  }

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
              <h1 className="text-2xl font-bold">Sales Orders</h1>
                <div className="lg:ml-20 flex-1">
                  <SalesOrderSearch
                    onFilterChange={setSearchConfig}
                    initialFilters={{
                      orderId: true,
                      customerName: true,
                      orderDate: true,
                      shipmentDate: true,
                      totalPrice: true
                    }}
                  />
                </div>
            </div>
          </div>

          {/* Action Bar */}
          <SalesActionBar 
            selectedOrders={selectedOrders}
            onCreateNew={navigateToAddSalesPage}
            onGenerateInvoice={handleGenerateInvoice}
            onGenerateQuotation={handleGenerateQuotation}
            onGenerateReceipt={handleGenerateReceipt}
            onReturnProduct={handleReturnProduct}
            onHighlightSelections={handleHighlightSelections}
          />

          {/* Content Area */}
          <div className="mt-4">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <p>Loading...</p>
              </div>
            ) : (
            data && (
              <SalesTable 
                salesOrders={filteredData} 
                selectedOrders={selectedOrders}
                onSelectionChange={setSelectedOrders}
                handleDeleteData={handleDeleteData}
                handleEditData={handleEditData}
                userRole="Manager"
                username={username}
                highlightSelections={highlightSelections}
                setHighlightSelections={setHighlightSelections}
              />
              )
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Sales;