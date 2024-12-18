import React, { useState, useContext, useEffect } from 'react';
import instance from "../axiosConfig";
import { GlobalContext } from "../globalContext";
import { Card, CardContent } from "../ui/card";
import { AlertCircle, Plus, X, Search, Info } from "lucide-react";
import { Button } from "../ui/button";
import { useToast } from "../ui/use-toast";

const PurchaseItemTable = ({ items, setItems }) => {
  const { username } = useContext(GlobalContext);
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [currentIndex, setCurrentIndex] = useState();
  const [productData, setProductData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('product_name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [formState, setFormState] = useState({
  quantity: '',  
  // ... other form fields
  });

  useEffect(() => {
    console.log("Component mounted with username:", username);
    console.log("Access token present:", !!localStorage.getItem('accessToken'));
  }, [username]);

  // Calculation Functions
  const calculateItemDiscount = (item) => {
    if (!item.cost || !item.quantity) return 0;
    const subtotal = item.cost * item.quantity;
    return subtotal * (item.discount || 0) / 100;
  };

  const calculateTotalAmount = (items) => {
    return items.reduce((total, item) => {
      return total + (item.cost || 0) * (item.quantity || 0);
    }, 0);
  };

  const calculateItemTotal = (item) => {
    if (!item.quantity || (item.cost === undefined && item.Product?.cost === undefined)) {
      return 0;
    }
    const cost = item.cost || item.Product?.cost || 0;
    const quantity = parseInt(item.quantity, 10) || 0;
    const total = parseFloat(cost) * quantity;
    return isNaN(total) ? 0 : total;
  };

  const calculateSubTotal = () => {
    return items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  const handleDiscountChange = (event, index) => {
    const value = parseFloat(event.target.value);
    if (value < 0 || value > 100 || isNaN(value)) return;
    
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      discount: value
    };
    setItems(newItems);
  };

  const handleItemClick = async (index) => {
    setLoading(true);
    try {
      // Encode the username to handle spaces and special characters
      const encodedUsername = encodeURIComponent(username);
      console.log("Making API call with encoded username:", encodedUsername);
      
      // Remove the duplicate /api since it's already in the baseURL
      const response = await instance.get(`/user/${encodedUsername}/inventories`);
      
      console.log("API Response:", response.data);
      
      if (response.data?.inventories) {
        setProductData(response.data.inventories);
        setCurrentIndex(index);
        setShowModal(true);
      } else {
        throw new Error('No inventory data received');
      }
    } catch (error) {
      console.error("Error fetching inventory:", error.response || error);
      // More detailed error messaging
      const errorMessage = error.response?.status === 404 
        ? "Inventory endpoint not found. Please check API route configuration."
        : error.response?.data?.message || "Failed to fetch inventory items";
      
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (event, index) => {
    const value = parseInt(event.target.value);
    if (value < 0 || isNaN(value)) return;
    
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      quantity: value
    };
    setItems(newItems);
  };

  const filterProducts = (products) => {
    if (!Array.isArray(products)) {
      console.log('Products is not an array:', products);
      return [];
    }
    
    if (!searchTerm.trim()) {
      return sortProducts(products);
    }
    
    const searchLower = searchTerm.toLowerCase();
    
    return sortProducts(products.filter(product => 
      String(product.product_name || '').toLowerCase().includes(searchLower) ||
      String(product.sku_number || '').toString().includes(searchLower) ||
      String(product.brand || '').toLowerCase().includes(searchLower)
    ));
  };

  const sortProducts = (products) => {
  return [...products].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    }
    return aValue < bValue ? 1 : -1;
  });
  };

  const updateItems = (product) => {
    console.log("Selected product:", product); 
    
    const newItems = [...items];
    newItems[currentIndex] = {
      product_uuid: product.product_uuid,
      product_name: product.product_name,
      sku_number: product.sku_number,
      quantity: 1,
      cost: parseFloat(product.cost) || 0, 
      current_stock: product.product_stock,
      brand: product.brand,
      manufacturer: product.manufacturer,
      Product: product 
    };
    
    console.log("Updated items:", newItems); 
    setItems(newItems);
    closeModal();
  };

  const ProductsList = ({ loading, productData, searchTerm, filterProducts, updateItems }) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    const filteredProducts = filterProducts(productData);
    
    if (filteredProducts.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          {searchTerm ? 'No items match your search' : 'No items available'}
        </div>
      );
    }

    return (
      <div className="grid gap-3">
        {filteredProducts.map((product) => (
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
              <div>
                <div className="font-medium">{product.product_name}</div>
                <div className="text-sm text-gray-500">
                  SKU: {product.sku_number}
                  {product.brand && ` • Brand: ${product.brand}`}
                </div>
                <div className="text-sm text-gray-500">
                  Manufacturer: {product.manufacturer || 'N/A'}
                </div>
                <div className="text-sm mt-1">
                  Current Stock: {product.product_stock} units
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-blue-600">
                  Cost: MYR {typeof product.cost === 'number' ? 
                    product.cost.toFixed(2) : 
                    parseFloat(product.cost || 0).toFixed(2)}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    );
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

  return (
    <div className="space-y-6">
      {/* Main Table */}
      <div className="w-full overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Item Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Current Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cost (MYR)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total (MYR)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-500">
                        <span>Click to select an item</span>
                      </div>
                    )}
                  </button>
                </td>

                {/* Current Stock Cell */}
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    {item.current_stock || '-'}
                  </div>
                </td>

                {/* Order Quantity Cell */}
                <td className="px-6 py-4">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity || ''}
                    onChange={(e) => handleQuantityChange(e, index)}
                    className="w-20 px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </td>

                {/* Cost Cell */}
                <td className="px-6 py-4">
                  <div className="text-sm">
                    {(item.cost !== undefined && item.cost !== null) ? 
                      Number(item.cost).toFixed(2) : 
                      (item.Product?.cost !== undefined && item.Product?.cost !== null) ?
                      Number(item.Product.cost).toFixed(2) : '-'}
                  </div>
                </td>

                {/* Total Cell */}
                <td className="px-6 py-4">
                  <div className="text-sm font-medium">
                    {calculateItemTotal(item).toFixed(2)}
                  </div>
                </td>

                {/* Actions Cell */}
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

      {/* Add Item Button */}
      <div className="flex justify-between items-center">
        <Button
          onClick={addNewRow}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4" />
          <span>Add Item</span>
        </Button>
        
        <div className="text-sm text-gray-500">
          Total: MYR {calculateSubTotal().toFixed(2)}
        </div>
      </div>

      {/* Item Selection Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl h-[80vh] flex flex-col">
            <CardContent className="flex flex-col h-full p-6 bg-white">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Select Item</h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Search Input */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg"
                />
              </div>

              {/* Products List */}
              <div className="flex-1 overflow-y-auto">
                <ProductsList
                  loading={loading}
                  productData={productData}
                  searchTerm={searchTerm}
                  filterProducts={filterProducts}
                  updateItems={updateItems}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PurchaseItemTable;