import React, { useEffect, useState, useContext, useRef } from "react";
import "./styles/appointments.css";
import Header from "./header";
import Sidebar from "./sidebar";
import axios from "axios";
import { GlobalContext } from "./globalContext";
import ItemTable from "./addSalesInventoryTable";
import BottomBar from "./formBtmBar";
import { useNavigate } from 'react-router-dom';

function AddSales() {
  return (
    <div className="appointments-container">
      <Header />
      <Sidebar />
      <MainContent />
    </div>
  );
}

function MainContent() {
  const navigation = useNavigate();
  const [customerData, setCustomerData] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [productData, setProductData] = useState(null);
  const { username } = useContext(GlobalContext);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([{}]);
  const [showCustomer, setShowCustomer] = useState(false);
  const dropdownRef = useRef(null);
  const [salesOrderRef, setSalesOrderRef] = useState("");
  const [orderDate, setOrderDate] = useState();
  const [shipmentDate, setShipmentDate] = useState();
  const [paymentTerms, setPaymentTerms] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("");
  const [deliveryDate, setDeliveryDate] = useState();
  
  const handleInputClick = async () => {
    if(showCustomer === true){
      setShowCustomer(false);
      return;
    }
    await axios.get(`http://localhost:3002/api/user/${username}/customers`).then((response) => {
      setCustomerData(response.data);
      setLoading(false);
      setShowCustomer(true);
    }); 
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setShowCustomer(false);
    }
  };

  const handleCustomerClick = (customer) => {
    setSelectedCustomer(() => customer);
    setShowCustomer(false);
  }

  const handleSalesOrderRefChange = (event) => {
    setSalesOrderRef(event.target.value);
  }

  const handleOrderDateChange =  (event) => {
    setOrderDate(event.target.value);
  }

  const handleDeliveryDateChange =  (event) => {
    setDeliveryDate(event.target.value);
  }

  const handleDeliveryMethodChange =  (event) => {
    setDeliveryMethod(event.target.value);
  }


  const handleShipmentDateChange =  (event) => {
    setShipmentDate(event.target.value);
  }

  const handlePaymentTermsChange = (event) => {
    setPaymentTerms(event.target.value);
  }

  const handleSubmit = async () => {
    const obj = {
      orderDateTime: orderDate,
      expectedShipmentDate: shipmentDate,
      paymentTerms: paymentTerms,
      deliveryMethod: deliveryMethod,
      customerUUID: selectedCustomer.customer_uuid,
      itemsList: items.map(item => ({
        uuid: item.product_uuid,
        quantity: item.quantity
      }))
    }

    console.log(obj);

    axios.post(`http://localhost:3002/api/user/${username}/salesOrder`, obj).then((_) => {
      window.alert('Sales order created successfully!');
      navigation(-1);
    })
  }

  const handleCancelClick = () => {
    const confirm = window.confirm("Discard changes?");
    if(confirm){
      navigation(-1);
    }
    return; 
  }

  return (
    <div className="ml-[220px] mt-[80px]">
      <div className="flex ms-5 mb-[100px] me-5 mt-5 flex-col">
        <div className="flex flex-row">
          <p className="flex-1 font-bold text-3xl ms-5" type="submit">
            Add Sales
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mt-[20px] flex flex-1 w-3/4 flex-col shadow-lg px-5 py-5 rounded-md">
            <div class="relative w-full max-w-xl space-x-8 flex flex-row">
              <div className="flex flex-[3_3_0%]">
                <h3 className="text-red-500">Customer Name</h3>
              </div>
              <div className="flex flex-[5_5_0%]">
                <input
                  type="text"
                  class="w-full pl-3 pr-10 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring focus:border-blue-300"
                  placeholder="Select Customer"
                  value={selectedCustomer ? selectedCustomer.customer_name : ""}
                ></input>
                {showCustomer && (
                  <div className="absolute w-64" ref={dropdownRef}>
                    <div className="absolute mt-1 w-full bg-white border rounded-lg shadow-lg z-10">
                      <ul className="py-1">
                        {customerData.customers.map((customer) => (
                          <li
                            key={customer.customer_uuid}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => handleCustomerClick(customer)}
                          >
                            {customer.customer_name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              <div class="absolute inset-y-0 right-0 flex items-center pr-3">
                <button
                  class="p-1 focus:outline-none"
                  type="button"
                  onClick={handleInputClick}
                >
                  <svg
                    class="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 9l-7 7-7-7"
                    ></path>
                  </svg>
                </button>
                <button class="p-1 focus:outline-none">
                  <svg
                    class="w-5 h-5 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    ></path>
                  </svg>
                </button>
              </div>
            </div>
            <div className="mt-5 flex flex-row items-center w-full max-w-xl space-x-32">
              <div className="flex-1">
                <h3 className="text-red-500">Sales Orders Reference Number</h3>
              </div>
              <div className="flex-[3_3_0%]">
                <input
                  type="text"
                  className="w-full h-8 pl-3 pr-10 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring focus:border-blue-300"
                  onChange={handleSalesOrderRefChange}
                  value={salesOrderRef}
                ></input>
              </div>
            </div>
            <div className="mt-[20px] w-full max-w-xl space-x-32 flex flex-row">
              <div className="flex-[3_3_0%]">
                <h3 className="text-red-500">Sales Order Date</h3>
              </div>
              <div className="flex-[5_5_0%]">
                <input
                  type="date"
                  className="w-full h-8 pl-3 pr-10 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring focus:border-blue-300"
                  value={orderDate}
                  onChange={handleOrderDateChange}
                ></input>
              </div>
            </div>
            <div className="mt-[20px] w-full max-w-xl space-x-32 flex flex-row">
              <div className="flex-[3_3_0%]">
                <h3 className="text-red-500">Expected Shipment Date</h3>
              </div>
              <div className="flex-[5_5_0%]">
                <input
                  type="date"
                  className="w-full h-8 pl-3 pr-10 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring focus:border-blue-300"
                  value={shipmentDate}
                  onChange={handleShipmentDateChange}
                ></input>
              </div>
            </div>
            <div className="mt-[20px] w-full max-w-xl space-x-32 flex flex-row">
              <div className="flex-[3_3_0%]">
                <h3 className="text-red-500">Payment Terms</h3>
              </div>
              <div className="flex-[5_5_0%]">
                <input
                  type="payment"
                  className="w-full h-8 pl-3 pr-10 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring focus:border-blue-300"
                  value={paymentTerms}
                  onChange={handlePaymentTermsChange}
                ></input>
              </div>
            </div>
          </div>
          <div className="mt-[20px] flex flex-1 w-3/4 flex-col shadow-lg px-5 py-5 rounded-md">
            <div class="relative w-full max-w-xl space-x-8 flex flex-row items-center">
              <div className="flex flex-[3_3_0%]">
                <h3 className="text-red-500">Delivery Date</h3>
              </div>
              <div className="flex flex-[5_5_0%]">
                <input
                  type="date"
                  class="w-full pl-3 pr-10 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring focus:border-blue-300"
                  value={deliveryDate}
                  onChange={handleDeliveryDateChange}
                ></input>
              </div>
            </div>
            <div className="mt-[20px] w-full max-w-xl space-x-8 flex flex-row">
              <div className="flex-[3_3_0%]">
                <h3 className="text-red-500">Delivery Method</h3>
              </div>
              <div className="flex-[5_5_0%]">
                <input
                  type="payment"
                  className="w-full h-8 pl-3 pr-10 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring focus:border-blue-300"
                  value={deliveryMethod}
                  onChange={handleDeliveryMethodChange}
                ></input>
              </div>
            </div>
            <div class="mt-[20px] relative w-full max-w-xl space-x-8 flex flex-row">
              <div className="flex flex-[3_3_0%]">
                <h3 className="text-red-500">Shipping Address</h3>
              </div>
              <div className="flex flex-[5_5_0%]">
                <textarea
                  class="w-full pl-3 pr-10 py-2 h-40 border rounded-lg shadow-sm focus:outline-none focus:ring focus:border-blue-300"
                  readOnly={true}
                  value={selectedCustomer ? selectedCustomer.shipping_address : ''}
                ></textarea>
              </div>
            </div>
          </div>
          <div className="mt-[30px]">
            <ItemTable items={items} setItems={setItems}></ItemTable>
          </div>
        </form>
      </div>
      <BottomBar handleSubmit={handleSubmit} handleCancelClick={handleCancelClick}/>
    </div>
  );
}

export default AddSales;
