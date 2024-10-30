import React, { useState, useContext } from 'react';
import instance from "./axiosConfig";
import { GlobalContext } from "./globalContext";
import { Card, CardContent } from "./ui/card";
import { AlertCircle, Plus, X, Search } from "lucide-react";

const ItemTable = ({ items, setItems }) => {
  const { username } = useContext(GlobalContext);
  const [showModal, setShowModal] = useState(false);
  const [currentIndex, setCurrentIndex] = useState();
  const [productData, setProductData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [taxAmount, setTaxAmount] = useState(0);

  const handleItemClick = async (index) => {
    setLoading(true);
    try {
      const response = await instance.get(`http://localhost:3002/api/user/${username}/inventories`);
      setProductData(response.data);
      setCurrentIndex(index);
      setShowModal(true);
    } catch (error) {
      console.error("Failed to fetch inventory items:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = (quantity, index) => {
    const newItems = [...items];
    newItems[index].quantity = quantity;
    setItems(newItems);
  };

  const handleQuantityChange = (event, index) => {
    const value = parseFloat(event.target.value);
    if (value < 0) return;
    updateQuantity(value, index);
  };

  const updateItems = (inventory) => {
    const newItems = [...items];
    newItems[currentIndex] = {
      ...inventory,
      quantity: 1 // Default quantity for new items
    };
    setItems(newItems);
    closeModal();
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const addNewRow = () => {
    setItems([...items, {}]);
  };

  const deleteItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotal = (item) => {
    if (!item.price || !item.quantity) return 0;
    return (item.price * item.quantity * (1 + taxAmount)).toFixed(2);
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Item Details
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rate (MYR)
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tax
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount (MYR)
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <button
                    type="button"
                    onClick={() => handleItemClick(index)}
                    className="w-full text-left text-sm text-gray-900 hover:text-blue-600 focus:outline-none"
                  >
                    {item.inventory_name || "Click to select an item"}
                    {!item.inventory_name && (
                      <span className="text-gray-400 text-xs block">
                        Browse inventory items
                      </span>
                    )}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <input
                    type="number"
                    min="0"
                    value={item.quantity || ''}
                    onChange={(e) => handleQuantityChange(e, index)}
                    className="w-24 px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </td>
                <td className="px-6 py-4">
                  <input
                    type="number"
                    value={item.price || ''}
                    readOnly
                    className="w-32 px-2 py-1 text-sm border rounded-md bg-gray-50"
                    placeholder="0.00"
                  />
                </td>
                <td className="px-6 py-4">
                  <select
                    className="w-32 px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={taxAmount}
                    onChange={(e) => setTaxAmount(parseFloat(e.target.value))}
                  >
                    <option value={0}>No Tax</option>
                    <option value={0.06}>SST (6%)</option>
                  </select>
                </td>
                <td className="px-6 py-4 text-sm font-medium">
                  {calculateTotal(item)}
                </td>
                <td className="px-6 py-4">
                  <button
                    type="button"
                    onClick={() => deleteItem(index)}
                    className="text-red-600 hover:text-red-900 focus:outline-none"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={addNewRow}
        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Item
      </button>

      {/* Item Selection Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-6 flex flex-col h-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Select Item</h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="overflow-y-auto flex-1">
                  <div className="grid gap-3">
                    {productData.inventories?.map((product) => (
                      <button
                        key={product.product_uuid}
                        onClick={() => updateItems(product)}
                        className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <div className="font-medium text-gray-900">
                          {product.inventory_name}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          SKU: {product.sku_number} | Price: MYR {product.price}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ItemTable;