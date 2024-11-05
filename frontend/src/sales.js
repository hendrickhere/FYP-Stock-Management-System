import React, { useState, useEffect, useContext } from "react";
import Header from "./header";
import Sidebar from "./sidebar";
import { useNavigate } from 'react-router-dom';
import { GlobalContext } from "./globalContext";
import axiosInstance from './axiosConfig';
import SalesTable from './salesOrderTable';
import { FileText, FileSpreadsheet, Receipt, RotateCcw } from 'lucide-react';

function Sales() {
  return (
    <div className="flex flex-col h-screen w-full">
      <Header/> 
      <div className="flex flex-row flex-grow">
      <Sidebar />
      <MainContent />
      </div>
    </div>
  );
}

function MainContent() {
  const {username} = useContext(GlobalContext);
  const [filter, setFilter] = useState("");
  const [render, setRender] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigate();

  const ActionButton = ({ icon: Icon, label, onClick, variant = "default" }) => {
    const baseStyles = "flex items-center ml-10 mt-3 space-x-2 px-4 py-2 rounded-lg shadow transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-opacity-50";
    
    const variants = {
      default: "bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 focus:ring-gray-300",
      primary: "bg-white text-green-700 hover:bg-green-600 hover:text-white focus:ring-green-400",
      warning: "bg-white text-orange-700 hover:bg-orange-600 hover:text-white focus:ring-orange-400"
    };

    return (
      <button 
        className={`${baseStyles} ${variants[variant]}`}
        onClick={onClick}
      >
        {Icon && <Icon className="w-5 h-5" />}
        <span>{label}</span>
      </button>
    );
  };

  function handleFilterChange(event) {
    setFilter(() => event.target.value);
  }
  function navigateToAddSalesPage(){
    navigation("/sales/add_sales");
  }

  useEffect(() => {
    fetchSalesOrder();
  }, [render]);

  async function fetchSalesOrder() {
      try {
          setLoading(true);
          const encodedUsername = encodeURIComponent(username);
          console.log('Fetching sales orders for username:', encodedUsername);
          
          const response = await axiosInstance.get(`http://localhost:3002/api/user/${username}/salesOrders`);
          console.log('API Response:', response.data);
          
          if (response.data && Array.isArray(response.data.salesOrders)) {
              setData(response.data);
          } else {
              console.error('Unexpected response format:', response.data);
              setData({ salesOrders: [] });  // Set empty array instead of null
          }
      } catch (error) {
          console.error('Error fetching sales orders:', error);
          if (error.response) {
              console.error('Error response:', error.response.data);
          }
          setData({ salesOrders: [] });  // Set empty array instead of null
      } finally {
          setLoading(false);
      }
  }

  return (
    <div className="flex-auto ml-52 p-4">
      <div className="flex flex-row ">
        <h1 className="text-2xl font-bold">Sales Order</h1>
        <input
          className="ml-32 mb-2 h-8 w-80 border-2 me-4 border-border-grey ps-2 rounded-lg"
          type="text"
          value={filter}
          onChange={handleFilterChange}
          placeholder="Search"
        />
        </div>
        <div className="flex flex-column">
        <div className="flex flex-row my-3">
        <button className="flex items-center mt-3 space-x-2 px-4 py-2 bg-white text-green-700 font-medium rounded-lg shadow hover:bg-green-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75"
          onClick={navigateToAddSalesPage}>
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              ></path>
            </svg>
            <span>Create Order</span>
        </button>
        <ActionButton
          icon={FileText}
          label="Generate Invoice"
          onClick={() => console.log('Generate Invoice')}
        />
        <ActionButton
          icon={FileSpreadsheet}
          label="Generate Quotation"
          onClick={() => console.log('Generate Quotation')}
        />
        <ActionButton
          icon={Receipt}
          label="Generate Receipt"
          onClick={() => console.log('Generate Receipt')}
        />
        <ActionButton
          icon={RotateCcw}
          label="Return Product"
          variant="warning"
          onClick={() => console.log('Return Product')}
        />
        </div>  
      </div>
      <div className="flex-1 mt-[20px] w-full">
        
        {!loading && data && (
          <SalesTable
            salesOrders={data}
          />
        )}
        {loading && <p>Loading...</p>}
      </div>
    </div>
  );
}

export default Sales;
