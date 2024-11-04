import React, {useState, useEffect, useContext} from "react";
import Header from './header';
import Sidebar from './sidebar';
import { useNavigate } from 'react-router-dom';
import axiosInstance from './axiosConfig';
import { GlobalContext } from "./globalContext";
import ProductTable from "./inventoryTable";
import { CiExport } from "react-icons/ci";

function Inventory() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex flex-col h-screen w-full">
      <Header/> 
      <div className="flex flex-row flex-grow">
        <Sidebar />
        <MainContent isMobile={isMobile} />
      </div>
    </div>
  );
}

function MainContent({ isMobile }) {
  const { username } = useContext(GlobalContext);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState();
  const navigation = useNavigate();
  const [filter, setFilter] = useState("");
  const [render, setRender] = useState("false");

  async function fetchInventories() {
    await axiosInstance
      .get(`http://localhost:3002/api/user/${username}/inventories`)
      .then((response) => {
        setData(() => response.data);
        console.log(`response is here! + ${response.data}`);
        setLoading(() => false);
      });
  }

  async function deleteInventory(index) {
    const confirm = window.confirm(
      "Are you sure you want to delete this inventory?"
    );
    if (confirm) {
      await axiosInstance
        .put(
          `http://localhost:3002/api/user/${username}/${data.inventories[index].product_uuid}/delete`
        )
        .then(() => {
          window.alert("Inventory successfully deleted");
          setRender(() => !render);
        });
    }
    return; 
  }

  useEffect(() => {
    fetchInventories();
  }, [render]);

  function handleEditData(index){
    navigation('/inventory/add_inventory', {state: {inventoryuuid: data.inventories[index].product_uuid, isAdd: false}});
  }

  function handleDeleteData(index){
    deleteInventory(index);
  }
  
  function handleFilterChange(event){
    setFilter(() => event.target.value);
  }

  function navigateToAddProductPage(){
    navigation('/inventory/add_inventory', {state: {uuid: "", isAdd: true}});
  }

  return (
    <main className="flex-1 transition-all duration-300 ease-in-out">
      <div className={`
        p-4 w-full
        ${isMobile ? 'max-w-full' : 'ml-[13rem]'}
      `}>

        {/* Title and Search Section */}
        <div className="flex flex-col lg:flex-row lg:items-center mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center w-full gap-4">
            <h1 className="text-2xl font-bold">Inventory</h1>
            <div className="lg:w-auto lg:ml-20">
              <input
                className="w-full lg:w-[20rem] h-8 border-2 border-border-grey ps-2 rounded-lg"
                type="text"
                value={filter}
                placeholder="Search"
                onChange={handleFilterChange}
              />
            </div>
          </div>
        </div>

        {/* Buttons Section */}
        <div className={`
          flex
          flex-row
          xs:flex-column
          gap-10
          mb-6
          ${isMobile ? 'items-stretch' : 'items-start'}
        `}>
          <button
            className="inline-flex items-center justify-center whitespace-nowrap px-4 py-2 bg-white text-green-700 font-medium rounded-lg shadow hover:bg-green-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75"
            onClick={navigateToAddProductPage}
          >
            <svg
              className="w-5 h-5 mr-2"
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
            Add Product
          </button>
          
          <button 
            className="inline-flex items-center justify-center whitespace-nowrap px-4 py-2 bg-white font-medium rounded-lg shadow focus:outline-none focus:ring-2"
          >
            <CiExport className="w-5 h-5 mr-2" />
            Export
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {!loading && data && (
              <ProductTable
                products={data}
                handleDeleteData={handleDeleteData}
                handleEditData={handleEditData}
              />
            )}
            {loading && (
              <div className="flex justify-center items-center py-8">
                <p>Loading...</p>
              </div>
            )}
            {!loading && (!data || data.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <p className="mb-2">No inventory found</p>
                <p className="text-sm">Add a product to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default Inventory;