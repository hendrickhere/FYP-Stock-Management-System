import React, { useState, useContext } from "react";
import instance from "../axiosConfig";
import { GlobalContext } from "../globalContext";
import { Card, CardContent } from "../ui/card";
import { AlertCircle, Plus, X, Search, Minus, Info } from "lucide-react";
import toast from "react-hot-toast";

const ItemTable = ({ items, setItems }) => {
  const { username } = useContext(GlobalContext);
  const [showModal, setShowModal] = useState(false);
  const [currentIndex, setCurrentIndex] = useState();
  const [productData, setProductData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [taxAmount, setTaxAmount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("product_name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [serialNumbers, setSerialNumbers] = useState({});
  const [showSerialModal, setShowSerialModal] = useState(false);
  const [currentSerialItem, setCurrentSerialItem] = useState(null);
  const [currentSerialIndex, setCurrentSerialIndex] = useState(null);
  const [tempSerialNumber, setTempSerialNumber] = useState("");
  // Calculation Functions
  const calculateItemDiscount = (item) => {
    if (!item.price || !item.quantity) return 0;
    const subtotal = item.price * item.quantity;
    return (subtotal * (item.discount || 0)) / 100;
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
      discount: value,
    };
    setItems(newItems);
  };

  const filterProducts = (products) => {
    // Early return if products is not an array
    if (!Array.isArray(products)) {
      console.log("Products is not an array:", products);
      return [];
    }

    // If no search term, return all products
    if (!searchTerm.trim()) {
      return products;
    }

    const searchLower = searchTerm.toLowerCase();

    return products.filter((product) => {
      // Early return if product is not an object
      if (!product || typeof product !== "object") {
        return false;
      }

      // Safely access and compare values
      const nameMatch = String(product.product_name || "")
        .toLowerCase()
        .includes(searchLower);
      const skuMatch = String(product.sku_number || "").includes(searchLower);
      const brandMatch = String(product.brand || "")
        .toLowerCase()
        .includes(searchLower);

      return nameMatch || skuMatch || brandMatch;
    });
  };

  const getFilteredProducts = () => {
    const productsArray = productData?.inventories || [];
    console.log("Products array before sorting:", productsArray);
    const sortedProducts = sortProducts(productsArray);
    console.log("Products after sorting:", sortedProducts);
    return filterProducts(sortedProducts);
  };

  // Sort function
  const sortProducts = (products) => {
    if (!products) return [];
    return [...products].sort((a, b) => {
      if (sortDirection === "asc") {
        return a[sortField] > b[sortField] ? 1 : -1;
      }
      return a[sortField] < b[sortField] ? 1 : -1;
    });
  };

  // Toggle sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleItemClick = async (index) => {
    setLoading(true);
    try {
      const response = await instance.get(
        `http://localhost:3002/api/user/${username}/inventories`
      );
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
      return;
    }
    
    // Clear serial numbers if quantity changes
    if (value !== item.quantity) {
      item.serialNumbers = [];
      setSerialNumbers(prev => ({
        ...prev,
        [index]: []
      }));
      toast.info('Serial numbers cleared due to quantity change');
    }
    
    item.quantity = value;
    setItems(newItems);
  };

  const isSerialNumberComplete = (index) => {
    const item = items[index];
    const serialCount = serialNumbers[index]?.length || 0;
    return serialCount === item.quantity;
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

  const handleSerialClick = (index, item) => {
    if (!item.quantity) {
      toast.error("Please set quantity before adding serial numbers");
      return;
    }
    setCurrentSerialItem(item);
    setCurrentSerialIndex(index);
    setShowSerialModal(true);
  };

  const fetchProductUnit = async (serialNumber) => {
    try{
      const productUnit = await instance.get(`/products/unit?serialNumber=${serialNumber}`);
      return productUnit; 

    } catch (err) {
      console.error(err.message);
      return undefined; 
    }
  }
  const addSerial = async () => {
    if (!tempSerialNumber.trim()) return;

    const productUnit = await fetchProductUnit(tempSerialNumber);
    if (!productUnit) {
      toast.error("Serial number does not exist");
      setTempSerialNumber("");
      return;
    }
    const currentSerials = serialNumbers[currentSerialIndex] || [];
    if (currentSerials.length >= currentSerialItem.quantity) {
      toast.error("Cannot add more serial numbers than quantity");
      return;
    }
    if (currentSerials.includes(tempSerialNumber)) {
      toast.error("Serial number already added");
      return;
    }

    const updatedSerials = [
      ...(serialNumbers[currentSerialIndex] || []),
      tempSerialNumber,
    ];

    setSerialNumbers((prev) => ({
      ...prev,
      [currentSerialIndex]: updatedSerials,
    }));
    setTempSerialNumber("");

    const newItems = [...items];
    newItems[currentSerialIndex] = {
      ...newItems[currentSerialIndex],
      serialNumbers: updatedSerials,
    };
    setItems(newItems);
  };

  const removeSerial = (itemIndex, serialIndex) => {
    setSerialNumbers((prev) => ({
      ...prev,
      [itemIndex]: prev[itemIndex].filter((_, i) => i !== serialIndex),
    }));

    // Update the items array
    const newItems = [...items];
    newItems[itemIndex] = {
      ...newItems[itemIndex],
      serialNumbers: serialNumbers[itemIndex].filter(
        (_, i) => i !== serialIndex
      ),
    };
    setItems(newItems);
  };

  const closeModal = () => {
    setShowModal(false);
    setSearchTerm("");
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
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Item Details
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Quantity
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Rate (MYR)
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Amount (MYR)
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
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
                  {item.product_name && serialNumbers[index]?.length > 0 && (
                    <div className="mt-2 text-sm text-gray-500">
                      <div className="font-medium">Serial Numbers:</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {serialNumbers[index].map((serial, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100"
                          >
                            {serial}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeSerial(index, i);
                              }}
                              className="ml-1 text-gray-400 hover:text-gray-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </td>

                {/* Quantity Cell */}
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="0"
                      max={item.product_stock}
                      value={item.quantity || ""}
                      onChange={(e) => handleQuantityChange(e, index)}
                      className={`w-20 px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        item.quantity > item.product_stock
                          ? "border-red-500"
                          : "border-gray-300"
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
                    {parseFloat(item.price)
                      ? parseFloat(item.price).toFixed(2)
                      : "-"}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-medium">
                  {calculateTotal(item)}
                </td>

                {/* Actions Cell */}
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    {item.product_name && (
                      <button
                        type="button"
                        onClick={() => handleSerialClick(index, item)}
                        className={`focus:outline-none p-1 hover:bg-gray-100 rounded flex items-center ${
                          item.quantity && !isSerialNumberComplete(index)
                            ? "text-red-600 hover:text-red-900"
                            : "text-blue-600 hover:text-blue-900"
                        }`}
                        title={
                          !item.quantity
                            ? "Set quantity first"
                            : isSerialNumberComplete(index)
                            ? "Serial numbers complete"
                            : "Add required serial numbers"
                        }
                      >
                        <Info className="h-4 w-4" />
                        {item.quantity && !isSerialNumberComplete(index) && (
                          <span className="ml-1 text-xs">
                            {serialNumbers[index]?.length || 0}/{item.quantity}
                          </span>
                        )}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteItem(index)}
                      className="text-red-600 hover:text-red-900 focus:outline-none p-1 hover:bg-gray-100 rounded"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
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
                  onClick={() =>
                    setSortDirection((prev) =>
                      prev === "asc" ? "desc" : "asc"
                    )
                  }
                  className="px-3 py-2 border rounded-lg hover:bg-gray-50"
                  title={`Sort ${
                    sortDirection === "asc" ? "ascending" : "descending"
                  }`}
                >
                  {sortDirection === "asc" ? "↑" : "↓"}
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
                      {searchTerm
                        ? "No items found matching your search"
                        : "No items available"}
                    </div>
                  ) : (
                    <div className="grid gap-3 p-1">
                      {getFilteredProducts().map((product) => (
                        <button
                          key={product.product_uuid}
                          onClick={() => updateItems(product)}
                          className={`w-full text-left p-4 rounded-lg border transition-colors ${
                            product.product_stock <= 0
                              ? "border-red-200 bg-red-50 cursor-not-allowed"
                              : "border-gray-200 hover:border-blue-500"
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
                                {product.manufacturer &&
                                  `Manufacturer: ${product.manufacturer}`}
                                {product.unit && ` • Unit: ${product.unit}`}
                              </div>
                              {product.is_expiry_goods &&
                                product.expiry_date && (
                                  <div className="text-xs text-orange-500 mt-1">
                                    Expires:{" "}
                                    {new Date(
                                      product.expiry_date
                                    ).toLocaleDateString()}
                                  </div>
                                )}
                            </div>

                            {/* Price and Stock Information */}
                            <div className="text-right ml-4">
                              <div className="font-medium text-blue-600">
                                MYR {parseFloat(product.price)?.toFixed(2)}
                              </div>
                              <div
                                className={`text-sm mt-1 ${
                                  product.product_stock <= 5
                                    ? "text-orange-500"
                                    : product.product_stock <= 0
                                    ? "text-red-500"
                                    : "text-gray-500"
                                }`}
                              >
                                {product.product_stock <= 0
                                  ? "Out of Stock"
                                  : product.product_stock <= 5
                                  ? `Low Stock: ${product.product_stock}`
                                  : `Stock: ${product.product_stock}`}
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
      {showSerialModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg bg-white">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Add Serial Numbers</h2>
                <button
                  onClick={() => setShowSerialModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-2">
                    Serial Numbers:{" "}
                    {serialNumbers[currentSerialIndex]?.length || 0}/
                    {currentSerialItem?.quantity} required
                    {serialNumbers[currentSerialIndex]?.length ===
                      currentSerialItem?.quantity && (
                      <span className="text-green-500 ml-2">✓ Complete</span>
                    )}
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tempSerialNumber}
                      onChange={(e) => setTempSerialNumber(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault(); // Prevent form submission
                          addSerial();
                        }
                      }}
                      className="flex-1 px-3 py-2 border rounded-md"
                      placeholder="Enter or scan serial number"
                    />
                    <button
                      onClick={addSerial}
                      type="button"
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {serialNumbers[currentSerialIndex]?.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2">Added Serial Numbers:</h3>
                    <div className="space-y-1">
                      {serialNumbers[currentSerialIndex].map((serial, i) => (
                        <div
                          key={i}
                          className="flex justify-between items-center p-2 bg-gray-50 rounded"
                        >
                          <span>{serial}</span>
                          <button
                            type="button"
                            onClick={() => removeSerial(currentSerialIndex, i)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowSerialModal(false)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Done
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}
      ;
    </div>
  );
};

export default ItemTable;
