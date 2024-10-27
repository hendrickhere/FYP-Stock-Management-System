import React, {useState, useEffect, useContext} from "react";
import './styles/purchases.css';
import Header from './header';
import Sidebar from './sidebar';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; 
import { GlobalContext } from "./globalContext";
import PurchaseTable from "./purchaseTable";
import instance from "./axiosConfig";

function Purchases() {
  return(
    <div className="purchases-container">
      <Header/>
      <Sidebar/>
      <MainContent/>
    </div>
  )
}

function MainContent() {
  const { username } = useContext(GlobalContext);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState();
  const navigation = useNavigate();
  const [filter, setFilter] = useState("");
  const [render, setRender] = useState("false");

  async function fetchPurchases(pageNumber, pageSize) {
    try{
      await instance
      .get(`http://localhost:3002/api/purchases/${username}?pageNumber=${pageNumber}&pageSize=${pageSize}`)
      .then((response) => {
        setData(() => response.data);
        console.log(`response is here! + ${response.data}`);
        setLoading(() => false);
      });
    } catch (err){
      console.error(err);
    } 
  }

  async function deletePurchases(index) {
    const confirm = window.confirm(
      "Are you dure you want to delete this purchase order?"
    );
    if (confirm) {
      await axios.put(
        `http://localhost:3002/api/user/${username}/${data.purchases[index].purchases_order_id}/delete`
      )
      .then(() => {
        window.alert("Purchase Oder successfully deleted");
        setRender(() => !render);
      });
    }
    return;
  }

  useEffect(() => {
    fetchPurchases(1, 10);
  }, [render]);

  function handleEditData(index) {
    navigation('/purchases/add_purchases', {state: {purchasesuuid: data.purchases[index].purchases_order_id, isAdd: false}});
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
    <div className="ml-[260px] mt-[90px]">
      <div className="flex flex-row">
        <h1 className="text-2xl font-bold">Purchase Order</h1>
        <input
          className="ml-[30px] mb-2 h-8 w-80 border-2 me-4 border-border-grey ps-2 rounded-lg"
          type="text"
          placeholder="Search"
          value={filter}
          onChange={handleFilterChange}
        />
      </div>
      <div className="flex flex-column">
        <div className="flex flex-row">
          <button
            className="flex items-center space-x-2 px-4 py-2 bg-white text-green-700 font-medium rounded-lg shadow hover:bg-green-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75"
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
        </div>
      </div>
      <div className="flex-1 mt-[20px]">
        {!loading && data && (
          <PurchaseTable
            products={data}
            handleDeleteData={handleDeleteData}
            handleEditData={handleEditData}
          />
        )}
        {loading && <p>Loading...</p>}
      </div>
    </div>
  );
}

export default Purchases;