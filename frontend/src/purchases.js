import React, {useState, useEffect, useContext} from "react";
import './styles/purchases.css';
import Header from './header';
import Sidebar from './sidebar';
import { useNavigate } from 'react-router-dom';
import axiosInstance from './axiosConfig';
import { GlobalContext } from "./globalContext";
import PurchaseTable from "./purchaseTable";
import instance from "./axiosConfig";
import { 
  Receipt, BadgeDollarSign, ClipboardList, 
} from 'lucide-react';

function Purchases() {
  return(
    <div className="flex flex-col h-screen w-full">
      <Header/> 
      <div className="flex flex-row flex-grow">
      <Sidebar />
      <MainContent />
      </div>
    </div>
  )
}

function MainContent() {
  const { username } = useContext(GlobalContext);
  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPage, setTotalPage] = useState(0);
  const [data, setData] = useState();
  const navigation = useNavigate();
  const [filter, setFilter] = useState("");
  const [render, setRender] = useState("false");

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

  async function fetchPurchases(pageNumber, pageSize) {
      try {
          setLoading(true);
          const response = await instance.get(
              `http://localhost:3002/api/purchases/${username}?pageNumber=${pageNumber}&pageSize=${pageSize}`
          );
          console.log('Purchase orders response:', response.data);
          setData(response.data);
          setPageNumber(response.data.currentPage);
          setTotalPage(response.data.totalPage);
      } catch (err) {
          console.error('Error fetching purchase orders:', err);
          setData({ purchases: [] }); // Set empty array on error
      } finally {
          setLoading(false);
      }
  }

  async function deletePurchases(index) {
    const confirm = window.confirm(
      "Are you dure you want to delete this purchase order?"
    );
    if (confirm) {
      await axiosInstance.put(
        `http://localhost:3002/api/user/${username}/${data.purchases[index].purchases_order_id}/delete`
      )
      .then(() => {
        window.alert("Purchase Order successfully deleted");
        setRender(() => !render);
      });
    }
    return;
  }

  useEffect(() => {
    fetchPurchases(pageNumber, pageSize);
  }, [render, pageNumber]);

  function handleEditData(index) {
    navigation('add_purchases', {state: {purchasesuuid: data.purchases[index].purchases_order_id, isAdd: false}});
  }

  function handleDeleteData(index){
    deletePurchases(index);
  }

  function handleFilterChange(event){
    setFilter(() => event.target.value);
  }

  function navigateToAddPurchasesPage(){
    navigation('/purchases/add_purchases', {state: {uuid: "", isAdd: true}});
  }

  return (
    <div className="flex-auto ml-52 p-4">
      <div className="flex flex-row">
        <h1 className="text-2xl font-bold">Purchases</h1>
        <input
          className="ml-32 mb-2 h-8 w-80 border-2 me-4 border-border-grey ps-2 rounded-lg"
          type="text"
          placeholder="Search"
          value={filter}
          onChange={handleFilterChange}
        />
      </div>
      <div className="flex flex-column">
        <div className="flex flex-row my-3">
          <button
            className="flex items-center mt-3 space-x-2 px-4 py-2 bg-white text-green-700 font-medium rounded-lg shadow hover:bg-green-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75"
            onClick={navigateToAddPurchasesPage}
          >
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
            <span>Add Purchase Order</span>
          </button>
          <ActionButton
            icon={BadgeDollarSign}
            label="Manage Tax"
            onClick={() => console.log('Manage Tax')}
          />
          <ActionButton
            icon={ClipboardList}
            label="Record Expenses"
            onClick={() => console.log('Record Expenses')}
          />
          <ActionButton
            icon={Receipt}
            label="Create Bill"
            onClick={() => console.log('Create Bill')}
          />
        </div>
      </div>
      <div className="flex-1 mt-[20px]">
        {!loading && data && (
          <PurchaseTable
            purchases={data}
            handleDeleteData={handleDeleteData}
            handleEditData={handleEditData}
            currentPage = {pageNumber}
            setCurrentPage = {setPageNumber}
            totalPage = {totalPage}
          />
        )}
        {loading && <p>Loading...</p>}
      </div>
    </div>
  );
}

export default Purchases;