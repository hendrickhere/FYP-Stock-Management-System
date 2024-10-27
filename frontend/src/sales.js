import React, { useState, useEffect, useContext } from "react";
import Header from "./header";
import Sidebar from "./sidebar";
import { useNavigate } from 'react-router-dom';
import { GlobalContext } from "./globalContext";
import axiosInstance from './axiosConfig';
import SalesTable from './salesOrderTable';

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
          
          const response = await axiosInstance.get(`/sales/user/${encodedUsername}`);
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
      <div className="flex flex-row">
        <h1 className="text-2xl font-bold">Sales Order</h1>
        <input
          className="ml-[120px] mb-2 h-8 w-80 border-2 me-4 border-border-grey ps-2 rounded-lg"
          type="text"
          value={filter}
          onChange={handleFilterChange}
        />
        </div>
        <div className="flex flex-column">
        <div className="flex flex-row">
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
