import React, { useState, useEffect, useContext, useRef } from "react";
import Header from "../header";
import Sidebar from "../sidebar";
import { useNavigate } from 'react-router-dom';
import { GlobalContext } from "../globalContext";
import axiosInstance from '../axiosConfig';
import SalesTable from './salesOrderTable';
import SalesActionBar from "./salesActionBar";
import { useScrollDirection } from '../useScrollDirection';
import { motion } from 'framer-motion';
import SalesOrderSearch from './salesOrderSearch';
import Pagination from "../pagination_component/pagination";
import instance from "../axiosConfig";
import toast, { Toaster } from "react-hot-toast";
import ReturnModal from './ReturnModal';

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
  const [totalCount, setTotalCount] = useState(0);
  const [totalPage, setTotalPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const [pageNumber, setPageNumber] = useState(1); 
  const [pageSize, setPageSize] = useState(10);

  // Return Modal States
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [returnReason, setReturnReason] = useState("");
  const [selectedSerialNumbers, setSelectedSerialNumbers] = useState({});

  const fetchOrderDetails = async (orderId) => {
    try {
      const response = await axiosInstance.get(`/sales/${username}/salesOrders`, {
        params: {
          pageNumber: 1,
          pageSize: 1,
          searchConfig: JSON.stringify({
            term: orderId,
            activeFilters: ['orderId']
          }),
          includeDetails: true
        }
      });

      console.log('Request URL:', axiosInstance.getUri({
        url: `/sales/${username}/salesOrders`,
        params: {
          pageNumber: 1,
          pageSize: 1,
          searchConfig: JSON.stringify({
            term: orderId,
            activeFilters: ['orderId']
          }),
          includeDetails: true
        }
      }));
      
      
      if (response.data && Array.isArray(response.data.salesOrders) && response.data.salesOrders.length > 0) {
        setSelectedOrderDetails(response.data.salesOrders[0]);
      } else {
        throw new Error('Order not found');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Failed to fetch order details');
    }
  };

  const handleReturnProduct = async () => {
    if (selectedOrders.length === 1) {
      await fetchOrderDetails(selectedOrders[0]);
      setIsReturnModalOpen(true);
    }
  };

  const handleReturnComplete = async (products, date_of_return, sales_order_uuid, processed_by, reason) => {
    try {
      const response = await axiosInstance.post('/sales/return', {
        sales_order_uuid: sales_order_uuid,
        products: products,
        date_of_return: date_of_return,
        reason: reason,
        processed_by: processed_by
      });

      if (response.status === 201) {
        toast.success('Products returned successfully');
        setIsReturnModalOpen(false);
        setSelectedSerialNumbers({});
        setSelectedOrderDetails(null);
        setReturnReason("");
        setRender(prev => !prev);
      }
    } catch (error) {
      console.error('Error processing return:', error);
      toast.error(error.response?.data?.message || 'Failed to process return');
    }
  };

  // Document generation handlers
  const handleGenerateInvoice = async () => {
    console.log('Generating invoice for orders:', selectedOrders);
    try {
      const orderUuid = selectedOrders[0];
      const response = await instance.get(`/sales/generate-invoice/${orderUuid}`, {
        responseType: 'arraybuffer',
        headers: {
          'Accept': 'application/pdf',
        }
      });
  
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${orderUuid}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
  
      toast.success('Invoice generated successfully');
    } catch (error) {
      if (error.response?.data instanceof ArrayBuffer) {
        try {
          const decoder = new TextDecoder('utf-8');
          const errorText = decoder.decode(error.response.data);
          const errorData = JSON.parse(errorText);
          toast.error(errorData.message || 'Failed to generate invoice');
        } catch (decodeError) {
          toast.error('Failed to generate invoice');
        }
      } else {
        toast.error('Failed to generate invoice');
      }
      console.error('Error generating invoice:', error);
    }
  };

  const handleGenerateQuotation = async () => {
    console.log('Generating quotation for orders:', selectedOrders);
    // TODO: Implement quotation generation logic
  };

  const handleGenerateReceipt = async () => {
    console.log('Generating receipt for orders:', selectedOrders);
    // TODO: Implement receipt generation logic
  };

  const handlePageChange = (newPage) => {
    setPageNumber(newPage);
    fetchSalesOrder(newPage, pageSize);
  };
  
  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setPageNumber(1); 
    fetchSalesOrder(1, newPageSize);
  };
  
  const handleDeleteData = async (salesOrderUUID, managerPassword) => {
    try {
      await axiosInstance.delete(`/${username}/salesOrder/${salesOrderUUID}`, {
        data: { managerPassword }
      });
      fetchSalesOrder(pageNumber);
    } catch (error) {
      console.error('Error deleting sales order:', error);
      throw error;
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
    fetchSalesOrder(pageNumber, pageSize, searchConfig);
  }, [pageNumber, pageSize, searchConfig, render]);

  async function fetchSalesOrder(pageNumber, pageSize, searchConfig) {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        pageNumber: pageNumber,
        pageSize: pageSize,
        searchConfig: JSON.stringify(searchConfig)
      });
      
      console.log(`/sales/${username}/salesOrders?${params}`)
      const response = await axiosInstance.get(
        `/sales/${username}/salesOrders?${params}`
      );
      
      if (response.data && Array.isArray(response.data.salesOrders)) {
        setData(response.data);
      } else {
        setData({ salesOrders: [] });
      }

      if(response.data.pagination) {
        setPageNumber(response.data.pagination.currentPage); 
        setTotalPage(response.data.pagination.totalPages);
        setTotalCount(response.data.pagination.totalItems);
        setHasNextPage(response.data.pagination.hasNextPage);
        setHasPreviousPage(response.data.pagination.hasPreviousPage);
      }
    } catch (error) {
      console.error('Error fetching sales orders:', error);
      setData({ salesOrders: [] });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 h-[calc(100vh-4rem)]"> 
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
              <h1 className="text-xl font-medium">Sales Orders</h1>
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
            isMobile={isMobile}
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
                  salesOrders={data} 
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
            <Pagination 
              currentPage={pageNumber}
              totalPages={totalPage}
              onPageChange={handlePageChange}
              hasNextPage={hasNextPage}
              hasPreviousPage={hasPreviousPage}
              pageSize={pageSize}
              onPageSizeChange={handlePageSizeChange}
              totalItems={totalCount}
            />
          </div>

          {/* Return Modal */}
          <ReturnModal
            isOpen={isReturnModalOpen}
            onClose={() => {
              setIsReturnModalOpen(false);
              setSelectedSerialNumbers({});
              setSelectedOrderDetails(null);
              setReturnReason("");
            }}
            selectedOrderDetails={selectedOrderDetails}
            selectedSerialNumbers={selectedSerialNumbers}
            setSelectedSerialNumbers={setSelectedSerialNumbers}
            returnReason={returnReason}
            setReturnReason={setReturnReason}
            onReturnComplete={handleReturnComplete}
            selectedOrderId={selectedOrders[0]}
            username={username}
          />

        </motion.div>
      </div>
    </div>
  );
}

export default Sales;