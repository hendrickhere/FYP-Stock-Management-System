import React, { useState, useEffect, useContext } from "react";
import Header from './header';
import Sidebar from './sidebar';
import { useNavigate } from 'react-router-dom';
import axiosInstance from './axiosConfig';
import { Plus } from 'lucide-react';
import VendorTable from './vendorTable';
import CustomerTable from './customerTable';
import StaffTable from './staffTable';

function Stakeholders() {
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
  const [view, setView] = useState('vendor');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState("");
  const navigation = useNavigate();

  useEffect(() => {
    fetchData();
  }, [view]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/stakeholders/${view}s`);
      setData(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      setData({ [view + 's']: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteData = async (index) => {
    const confirm = window.confirm(
      `Are you sure you want to delete this ${view}?`
    );
    if (confirm) {
      try {
        await axiosInstance.delete(`/stakeholders/${view}s/${data[view + 's'][index][view + '_id']}`);
        window.alert(`${view.charAt(0).toUpperCase() + view.slice(1)} successfully deleted`);
        fetchData();
      } catch (error) {
        console.error(`Error deleting ${view}:`, error);
      }
    }
  };

  const handleEditData = (index) => {
    navigation(`/stakeholders/edit_${view}`, {
      state: { 
        id: data[view + 's'][index][view + '_id'],
        data: data[view + 's'][index],
        type: view 
      }
    });
  };

  const handleFilterChange = (event) => {
    setFilter(event.target.value);
  };

  const handleAdd = (type) => {
    navigation(`/stakeholders/add_${type}`, {
      state: { type }
    });
  };

  return (
    <div className="flex-auto ml-52 p-4">
      <div className="flex flex-row">
        <h1 className="text-2xl font-bold">Stakeholders</h1>
        <input
          className="ml-32 mb-2 h-8 w-80 border-2 me-4 border-border-grey ps-2 rounded-lg"
          type="text"
          placeholder="Search"
          value={filter}
          onChange={handleFilterChange}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex mt-3 mb-7">
        <button
          onClick={() => handleAdd('vendor')}
          className="flex items-center gap-2 px-4 py-2 font-medium text-green-700 bg-white rounded-lg shadow-sm hover:shadow transition-all duration-200"
        >
          <Plus className="h-5 w-5 text-green-700" />
          <span>Add vendor</span>
        </button>
        <button
          onClick={() => handleAdd('customer')}
          className="flex items-center gap-2 px-4 py-2 ml-10 font-medium text-green-700 bg-white rounded-lg shadow-sm hover:shadow transition-all duration-200"
        >
          <Plus className="h-5 w-5 text-green-700" />
          <span>Add customer</span>
        </button>
        <button
          onClick={() => handleAdd('staff')}
          className="flex items-center gap-2 px-4 py-2 ml-10 font-medium text-green-700 bg-white rounded-lg shadow-sm hover:shadow transition-all duration-200"
        >
          <Plus className="h-5 w-5 text-green-700" />
          <span>Add staff</span>
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1 relative mb-0">
        <button
          onClick={() => setView('vendor')}
          className={`px-6 py-2 rounded-t-lg transition-all duration-200 ${
            view === 'vendor' 
              ? 'bg-white text-purple-400 shadow-[0_-1px_3px_rgba(0,0,0,0.1)] z-10 font-semibold' 
              : 'bg-gray-50 hover:bg-gray-100'
          }`}
          style={{
            marginBottom: '-4px', 
            borderBottom: view === 'vendor' ? '1px solid white' : 'none', // Hides the table border underneath
          }}
        >
          Vendors
        </button>
        <button
          onClick={() => setView('customer')}
          className={`px-6 py-2 rounded-t-lg transition-all duration-200 ${
            view === 'customer' 
              ? 'bg-white text-purple-400 shadow-[0_-1px_3px_rgba(0,0,0,0.1)] z-10 font-semibold' 
              : 'bg-gray-50 hover:bg-gray-100'
          }`}
          style={{
            marginBottom: '-1px',
            borderBottom: view === 'customer' ? '1px solid white' : 'none',
          }}
        >
          Customers
        </button>
        <button
          onClick={() => setView('staff')}
          className={`px-6 py-2 rounded-t-lg transition-all duration-200 ${
            view === 'staff' 
              ? 'bg-white text-purple-400 shadow-[0_-1px_3px_rgba(0,0,0,0.1)] z-10 font-semibold' 
              : 'bg-gray-50 hover:bg-gray-100'
          }`}
          style={{
            marginBottom: '-1px',
            borderBottom: view === 'staff' ? '1px solid white' : 'none',
          }}
        >
          Staffs
        </button>
      </div>

      {/* Tables */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-t border-gray-200"> 
          {loading && (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          )}
          
          {!loading && data && view === 'vendor' && (
            <VendorTable
              vendors={data.vendors}
              handleDeleteData={handleDeleteData}
              handleEditData={handleEditData}
            />
          )}
          
          {!loading && data && view === 'customer' && (
            <CustomerTable
              customers={data.customers}
              handleDeleteData={handleDeleteData}
              handleEditData={handleEditData}
            />
          )}
          
          {!loading && data && view === 'staff' && (
            <StaffTable
              staffs={data.staffs}
              handleDeleteData={handleDeleteData}
              handleEditData={handleEditData}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default Stakeholders;