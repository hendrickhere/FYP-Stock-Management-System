import React, { useState, useEffect, useContext } from "react";
import "./styles/sales.css";
import Header from "./header";
import Sidebar from "./sidebar";
import { useNavigate } from 'react-router-dom';
import { GlobalContext } from "./globalContext";
import axios from "axios";
import SalesTable from './salesOrderTable';

function Sales() {
  return (
    <div className="sales-container">
      <MainContent />
      <Header />
      <Sidebar />
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

  async function fetchSalesOrder(){
    console.log(`http://localhost:3002/api/user/${username}/salesOrders`);
    await axios.get(`http://localhost:3002/api/user/${username}/salesOrders`).then((response) => {
      setData(() => response.data);
      console.log(`response is here! + ${response.data}`);
      setLoading(() => false);
    })
  }

  return (
    <div className="ml-[235px] mt-[80px] overflow-y-auto">
      <div className="flex flex-row">
        <h1 className="text-2xl font-bold">Sales Order</h1>
        <input
          className="ml-[120px] mb-2 h-8 w-80 border-2 me-4 border-border-grey ps-2 rounded-lg"
          type="text"
          value={filter}
          onChange={handleFilterChange}
        />
        <button className="ml-[150px] flex items-center space-x-2 px-4 py-2 bg-white text-green-700 font-medium rounded-lg shadow hover:bg-green-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75"
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
      <div className="flex-1 mt-[20px]">
        
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
