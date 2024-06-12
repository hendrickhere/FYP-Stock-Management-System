import React, { useState, useContext } from 'react';
import axios from 'axios';
import { GlobalContext } from "./globalContext";

const ItemTable = (props) => {
    const {items, setItems} = props;
    const {username} = useContext(GlobalContext);
  const [showModal, setShowModal] = useState(false);
  const [currentIndex, setCurrentIndex] = useState();
  
  const[productData, setProductData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [taxAmount, setTaxAmount] = useState(0);

  const handleItemClick = async (index) => {
    setLoading(() => true);
    await axios.get(`http://localhost:3001/api/user/${username}/inventories`).then((response) => {
        setProductData(() => response.data);
        setLoading(() => false);
      })
    setCurrentIndex(index);
    setShowModal(true);
    
  };
  

  const updateQuantity = (quantity, index) => {
    const newItems = [...items];
    newItems[currentIndex].quantity = quantity; 
    setItems(newItems);
  }

  const handleQuantityChange = (event, index) => {
    if(event.target.value < 0 ){
        return; 
    }
    updateQuantity(event.target.value, index);
  }

  const updateItems = (inventory) => {
    const newItems = [...items];
    newItems[currentIndex] = inventory;
    setItems(newItems);
    console.log(items);
    closeModal();
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const addNewRow = () => {
    setItems(() => 
        [...items, {}]
    );
  }

  const deleteItem = (index) => {
    setItems(() => items.filter((_, i) => i !== index));
  }

  const handleFocus = (index) => {
    if(currentIndex === index){
        return; 
    }
    setCurrentIndex(() => index);
  }

  const handleTaxChange = (event) => {
    setTaxAmount(() => parseFloat(event.target.value));
  }
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Item Table</h1>
        {/* <button className="text-blue-500">Bulk Actions</button> */}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="w-full bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              <th className="px-4 py-3">Item Details</th>
              <th className="px-4 py-3">Quantity</th>
              <th className="px-4 py-3">Rate</th>
              <th className="px-4 py-3">Tax</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr className="border-b">
                <td className="px-4 py-3 flex items-center">
                  <input
                    type="text"
                    value={item.inventory_name ?? ""}
                    placeholder="Type or click to select an item."
                    className="ml-4 flex-1 text-gray-500 bg-transparent border-none focus:outline-none"
                    onClick={() => handleItemClick(index)}
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    value={item.quantity ?? 0}
                    className="w-full text-center border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
                    onChange={(e) => handleQuantityChange(e, index)}
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    value={item.price}
                    className="w-full text-center border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
                    onFocus={() => handleFocus(index)}
                  />
                </td>
                <td className="px-4 py-3 relative">
                  <select className="w-full border rounded-lg py-1 px-2 focus:outline-none focus:ring focus:border-blue-300" onChange={handleTaxChange}>
                    <option value={0}>Select a Tax</option>
                    <option value={0.06}>{"SST (6%)"}</option>
                  </select>
                </td>
                <td className="px-4 py-3 font-bold text-center">
                  {item.price * item.quantity * (1 + taxAmount) ?? "0.00"}
                </td>
                <td className="px-4 py-3">
                  <button
                    className="text-red-500 focus:outline-none"
                    type="button"
                    onClick={() => deleteItem(index)}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      ></path>
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        className="mt-4 bg-blue-500 text-white py-2 px-4 rounded flex items-center space-x-2 focus:outline-none"
        type="button"
        onClick={addNewRow}
      >
        <svg
          className="w-5 h-5"
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
          ></path>
        </svg>
        <span>Add New Row</span>
      </button>

      {showModal && !loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <h2 className="text-lg font-bold mb-4">Select Item</h2>
            <div className="mb-4">
              {productData.inventories.map((product, index) => {
                return (
                  <div
                    className="bg-blue-100 p-2 rounded-lg mb-2"
                    onClick={() => updateItems(product)}
                  >
                    <p>{product.inventory_name}</p>
                    <p>{`SKU: ${product.sku_number} Rate: ${product.price}`}</p>
                  </div>
                );
              })}
              <button
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg flex items-center justify-center space-x-2 focus:outline-none"
                type="button"
              >
                <svg
                  className="w-5 h-5"
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
                  ></path>
                </svg>
                <span>Add New Item</span>
              </button>
            </div>
            <button
              className="bg-red-500 text-white py-2 px-4 rounded-lg focus:outline-none"
              onClick={closeModal}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemTable;