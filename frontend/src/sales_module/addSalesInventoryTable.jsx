import React, { useState, useContext } from 'react';
import instance from "../axiosConfig";
import { GlobalContext } from "../globalContext";
import { Card, CardContent } from "../ui/card";
import { AlertCircle, Plus, X, Search, Minus, Info } from "lucide-react";

const ItemTable = ({ items, setItems }) => {
  const { username } = useContext(GlobalContext);
  const [showModal, setShowModal] = useState(false);
  const [currentIndex, setCurrentIndex] = useState();
  const [productData, setProductData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [taxAmount, setTaxAmount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('product_name'); 
  const [sortDirection, setSortDirection] = useState('asc');

  // Calculation Functions
  const calculateItemDiscount = (item) => {
    if (!item.price || !item.quantity) return 0;
    const subtotal = item.price * item.quantity;
    return subtotal * (item.discount || 0) / 100;
  };

  const calculateItemTotal = (item) => {
    if (!item.price || !item.quantity) return 0;
    const subtotal = item.price * item.quantity;
    const discount = calculateItemDiscount(item);
    return subtotal - discount;
  };

  const calculateTaxForItem = (item) => {
    return calculateItemTotal(item) * taxAmount;
  };

  const calculateSubTotal = () => {
    return items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  const calculateTotalTax = () => {
    return items.reduce((sum, item) => sum + calculateTaxForItem(item), 0);
  };

  const calculateGrandTotal = () => {
    return calculateSubTotal() + calculateTotalTax();
  };

  const calculateTotalDiscount = () => {
    return items.reduce((sum, item) => sum + calculateItemDiscount(item), 0);
  };

  const handleDiscountChange = (event, index) => {
    const value = parseFloat(event.target.value);
    // Ensure discount is between 0 and 100
    if (value < 0 || value > 100 || isNaN(value)) return;
    
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      discount: value
    };
    setItems(newItems);
  };

  const filterProducts = (products) => {
    // Early return if products is not an array
    if (!Array.isArray(products)) {
      console.log('Products is not an array:', products);
      return [];
    }
    
    // If no search term, return all products
    if (!searchTerm.trim()) {
      return products;
    }
    
    const searchLower = searchTerm.toLowerCase();
    
    return products.filter(product => {
      // Early return if product is not an object
      if (!product || typeof product !== 'object') {
        return false;
      }
      
      // Safely access and compare values
      const nameMatch = String(product.product_name || '').toLowerCase().includes(searchLower);
      const skuMatch = String(product.sku_number || '').includes(searchLower);
      const brandMatch = String(product.brand || '').toLowerCase().includes(searchLower);
      
      return nameMatch || skuMatch || brandMatch;
    });
  };

  const getFilteredProducts = () => {
    const productsArray = productData?.inventories || [];
    console.log('Products array before sorting:', productsArray);
    const sortedProducts = sortProducts(productsArray);
    console.log('Products after sorting:', sortedProducts);
    return filterProducts(sortedProducts);
  };

  // Sort function
  const sortProducts = (products) => {
    if (!products) return [];
    return [...products].sort((a, b) => {
      if (sortDirection === 'asc') {
        return a[sortField] > b[sortField] ? 1 : -1;
      }
      return a[sortField] < b[sortField] ? 1 : -1;
    });
  };

  // Toggle sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleItemClick = async (index) => {
    setLoading(true);
    try {
      const response = await instance.get(`http://localhost:3002/api/user/${username}/inventories`);
      setProductData(response.data);
      setCurrentIndex(index);
      setShowModal(true);
      console.log("API Response:", response.data);
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
    
    const newItems = [...items];
    const item = newItems[index];
    
    if (value > item.product_stock) {
      // Optional: Show a warning toast/message here
      return;
    }
    
    item.quantity = value;
    setItems(newItems);
  };

  const handleQuantityAdjust = (index, increment) => {
    const newItems = [...items];
    const item = newItems[index];
    
    if (!item.quantity) item.quantity = 0;
    
    if (increment) {
      if (item.quantity >= item.product_stock) return;
      item.quantity += 1;
    } else {
      if (item.quantity <= 0) return;
      item.quantity -= 1;
    }
    
    setItems(newItems);
  };

  const updateItems = (product) => {
      console.log("Selected inventory:", product); 
      const newItems = [...items];
      newItems[currentIndex] = {
        product_uuid: product.product_uuid,
        product_name: product.product_name,
        sku_number: product.sku_number,
        quantity: 1,
        price: product.price,
      };
      console.log("Updated items:", newItems); 
      setItems(newItems);
      closeModal();
  };

  const closeModal = () => {
    setShowModal(false);
    setSearchTerm('');
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
    <div className="space-y-6">
      {/* Main Table */}
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

                {/* Item Details Cell */}
              <td className="px-6 py-4">
                <button
                  type="button"
                  onClick={() => handleItemClick(index)}
                  className="w-full text-left focus:outline-none"
                >
                  {item.product_name ? (
                    <div>
                      <div className="font-medium text-gray-900">
                        {item.product_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        SKU: {item.sku_number}
                        {item.brand && ` • Brand: ${item.brand}`}
                      </div>
                      {item.product_stock <= 5 && (
                        <div className="text-sm text-orange-500 flex items-center mt-1">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          Low stock: {item.product_stock} units left
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-gray-500">
                      <span>Click to select an item</span>
                      <span className="text-sm block text-gray-400">
                        Browse inventory items
                      </span>
                    </div>
                  )}
                </button>
              </td>

                {/* Quantity Cell */}
              <td className="px-6 py-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="0"
                    max={item.product_stock}
                    value={item.quantity || ''}
                    onChange={(e) => handleQuantityChange(e, index)}
                    className={`w-20 px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      item.quantity > item.product_stock ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0"
                  />
                  {item.product_name && (
                    <div className="flex space-x-1">
                      <button
                        type="button"
                        onClick={() => handleQuantityAdjust(index, false)}
                        className="p-1 hover:bg-gray-100 rounded"
                        disabled={!item.quantity || item.quantity <= 0}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuantityAdjust(index, true)}
                        className="p-1 hover:bg-gray-100 rounded"
                        disabled={item.quantity >= item.product_stock}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
                {item.quantity > item.product_stock && (
                  <p className="text-red-500 text-xs mt-1">
                    Exceeds available stock
                  </p>
                )}
              </td>

                {/* Unit Price Cell */}
                <td className="px-6 py-4">
                  <div className="text-sm">
                    {item.price ? item.price.toFixed(2) : '-'}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-medium">
                  {calculateTotal(item)}
                </td>

                {/* Actions Cell */}
                <td className="px-6 py-4">
                  <button
                    type="button"
                    onClick={() => deleteItem(index)}
                    className="text-red-600 hover:text-red-900 focus:outline-none p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tax and Total Summary */}
      <div className="flex justify-between items-start mt-6">
        {/* Add Item Button */}
        <button
          type="button"
          onClick={addNewRow}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </button>
      </div>

      {/* Item Selection Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl h-[80vh] flex flex-col">
            <div className="p-6 flex flex-col h-full bg-white">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Select Item</h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Search and Sort Controls */}
              <div className="flex gap-4 mb-4">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, SKU, or brand..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Sort Controls */}
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value)}
                  className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="product_name">Sort by Name</option>
                  <option value="price">Sort by Price</option>
                  <option value="product_stock">Sort by Stock</option>
                </select>
                <button
                  onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 border rounded-lg hover:bg-gray-50"
                  title={`Sort ${sortDirection === 'asc' ? 'ascending' : 'descending'}`}
                >
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </button>
              </div>

              {/* Products List */}
              {loading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto min-h-0">
                  {getFilteredProducts().length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      {searchTerm ? 'No items found matching your search' : 'No items available'}
                    </div>
                  ) : (
                    <div className="grid gap-3 p-1">
                      {getFilteredProducts().map((product) => (
                        <button
                          key={product.product_uuid}
                          onClick={() => updateItems(product)}
                          className={`w-full text-left p-4 rounded-lg border transition-colors ${
                            product.product_stock <= 0 
                              ? 'border-red-200 bg-red-50 cursor-not-allowed'
                              : 'border-gray-200 hover:border-blue-500'
                          }`}
                          disabled={product.product_stock <= 0}
                        >
                          <div className="flex justify-between items-start">
                            {/* Product Information */}
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">
                                {product.product_name}
                              </div>
                              <div className="text-sm text-gray-500 mt-1">
                                SKU: {product.sku_number}
                                {product.brand && ` • Brand: ${product.brand}`}
                              </div>
                              {product.description && (
                                <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                                  {product.description}
                                </div>
                              )}
                              {/* Additional Product Details */}
                              <div className="text-xs text-gray-500 mt-1">
                                {product.manufacturer && `Manufacturer: ${product.manufacturer}`}
                                {product.unit && ` • Unit: ${product.unit}`}
                              </div>
                              {product.is_expiry_goods && product.expiry_date && (
                                <div className="text-xs text-orange-500 mt-1">
                                  Expires: {new Date(product.expiry_date).toLocaleDateString()}
                                </div>
                              )}
                            </div>

                            {/* Price and Stock Information */}
                            <div className="text-right ml-4">
                              <div className="font-medium text-blue-600">
                                MYR {product.price?.toFixed(2)}
                              </div>
                              <div className={`text-sm mt-1 ${
                                product.product_stock <= 5 
                                  ? 'text-orange-500'
                                  : product.product_stock <= 0 
                                  ? 'text-red-500' 
                                  : 'text-gray-500'
                              }`}>
                                {product.product_stock <= 0 
                                  ? 'Out of Stock'
                                  : product.product_stock <= 5
                                  ? `Low Stock: ${product.product_stock}`
                                  : `Stock: ${product.product_stock}`
                                }
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
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