import React, { useState, useEffect, useContext } from 'react';
import { AlertCircle, Check, Edit2, Save, AlertTriangle, Plus, X, Search } from 'lucide-react';
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "../../ui/alert";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { Dialog, DialogContent } from "../../ui/dialog";
import { Card, CardHeader, CardTitle, CardContent } from "../../ui/card";
import ItemTable from "../../purchases_module/addPurchasesInventoryTable";
import { GlobalContext } from '../../globalContext';
import instance from '../../axiosConfig';

const PurchaseOrderPreview = ({ 
  extractedData,
  onConfirm = () => {}, 
  onModify = () => {},
  isProcessing = false,
  isMobile = false
}) => {

  const calculateSubtotal = (items) => {
    if (!Array.isArray(items)) return 0;
    return items.reduce((sum, item) => 
      sum + (parseFloat(item.price || 0) * parseInt(item.quantity || 0)), 
      0
    );
  };

  const [isEditing, setIsEditing] = useState(false);
  const [showInventoryTable, setShowInventoryTable] = useState(false);
  const [modifiedData, setModifiedData] = useState(() => {
    if (!extractedData?.items) {
      console.warn('No items data provided to PurchaseOrderPreview');
      return {
        items: [],
        metadata: {},
        financials: { subtotal: 0, tax: 0, shipping: 500, total: 500 }
      };
    }

    // Log incoming data to verify structure
    console.log('Initializing PurchaseOrderPreview with:', extractedData);

    // Map items while carefully preserving quantities
    const items = Array.isArray(extractedData.items) ? extractedData.items.map(item => ({
      productName: item.productName || item.product_name,
      sku: item.sku || item.sku_number,
      // Be explicit about quantity sources
      quantity: parseInt(item.orderQuantity || item.quantity || 0),
      price: parseFloat(item.cost || 0),
      productId: item.productId,
      type: item.type || 'existing'
    })) : [];

    // Calculate financials based on actual items
    const subtotal = items.reduce((sum, item) => 
      sum + (parseFloat(item.price || 0) * parseInt(item.quantity || 0)), 0
    );
    const tax = subtotal * 0.06;
    const shipping = 500;
    const total = subtotal + tax + shipping;

    return {
      items,
      metadata: extractedData.metadata || {},
      financials: { subtotal, tax, shipping, total }
    };
  });
  const [validationErrors, setValidationErrors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Add inventory state
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { username } = useContext(GlobalContext);

  useEffect(() => {
    if (showInventoryTable) {
      fetchInventoryItems();
    }
  }, [showInventoryTable]);

  const fetchInventoryItems = async () => {
    setLoading(true);
    try {
      const encodedUsername = encodeURIComponent(username);
      const response = await instance.get(`/user/${encodedUsername}/inventories`);
      
      if (response.data?.inventories) {
        setInventoryItems(response.data.inventories);
      } else {
        throw new Error('No inventory data received');
      }
    } catch (error) {
      console.error("Error fetching inventory:", error);
      // toast({
      //   variant: "destructive",
      //   title: "Error",
      //   description: "Failed to fetch inventory items"
      // });
    } finally {
      setLoading(false);
    }
  };

  const handleItemSelect = (selectedItem) => {
    const newItem = {
      productName: selectedItem.product_name,
      sku: selectedItem.sku_number,
      quantity: 1,
      price: parseFloat(selectedItem.cost || 0),
      productId: selectedItem.product_id,
      type: 'existing'
    };

    setModifiedData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
    setShowInventoryTable(false);
  };

  useEffect(() => {
    const items = modifiedData.items;
    const subtotal = calculateSubtotal(items);
    const tax = subtotal * 0.06;
    const total = subtotal + modifiedData.financials.shipping;

    setModifiedData(prev => ({
      ...prev,
      financials: {
        subtotal,
        tax,
        shipping: prev.financials.shipping,
        total
      }
    }));
  }, [modifiedData.items]);

  const totals = React.useMemo(() => {
    const items = modifiedData.items || [];
    const subtotal = items.reduce((sum, item) => 
      sum + (Number(item.price || 0) * Number(item.quantity || 0)), 
      0
    );
    
    return {
      subtotal,
      tax: subtotal * 0.06,
      shipping: 500, // Default shipping fee
      total: (subtotal * 1.06) + 500
    };
  }, [modifiedData.items]);

  const [newItem, setNewItem] = useState({
    productName: '',
    sku: '',
    quantity: '', 
    price: ''
  });

  // Validation function
  const validateData = (data) => {
    const errors = [];
    
    if (!data.items || data.items.length === 0) {
      errors.push('No items in order');
      return errors;
    }

    data.items.forEach((item, index) => {
      if (!item.productName) {
        errors.push(`Item ${index + 1}: Missing product name`);
      }
      if (!item.sku) {
        errors.push(`Item ${index + 1}: Missing SKU`);
      }
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Invalid quantity`);
      }
      if (!item.price || item.price <= 0) {
        errors.push(`Item ${index + 1}: Invalid price`);
      }
    });

    return errors;
  };

  const handleAddFromInventory = (selectedItems) => {
    // Map selected items to our format with default quantity of 1
    const newItems = selectedItems.map(item => ({
      productName: item.product_name,
      sku: item.sku_number,
      quantity: 1,
      price: parseFloat(item.cost || 0),
      productId: item.product_id,
      type: 'existing'
    }));
  
    // Add new items to existing items
    setModifiedData(prev => ({
      ...prev,
      items: [...prev.items, ...newItems]
    }));
  
    // Close the inventory table
    setShowInventoryTable(false);
  };

  // Handler for editing items
  const handleEdit = (itemIndex, field, value) => {
    setModifiedData(prev => ({
      ...prev,
      items: prev.items.map((item, idx) => 
        idx === itemIndex 
          ? { ...item, [field]: value }
          : item
      )
    }));
  };

  // Handler for saving changes
  const handleSave = () => {
    if (isProcessing) return;

    // Validate the data before saving
    const errors = validateData(modifiedData);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Clear any previous validation errors
    setValidationErrors([]);
    
    // Notify parent of modifications
    onModify(modifiedData);
    
    // Exit edit mode
    setIsEditing(false);
  };

  // Handler for removing items
  const handleRemoveItem = (index) => {
    setModifiedData(prev => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index)
    }));
  };

  // Handler for processing order
  const handleProcess = async () => {
    if (isProcessing) return; // Prevent multiple clicks
  
    try {
      // Validate before processing
      const errors = validateData(modifiedData);
      if (errors.length > 0) {
        setValidationErrors(errors);
        return;
      }
  
      setValidationErrors([]);
      await onConfirm(modifiedData); // Pass the modified data to parent
      setIsEditing(false); // Disable editing after successful processing
    } catch (error) {
      console.error('Error processing order:', error);
      setValidationErrors([error.message || 'Failed to process order']);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className={`
      w-full bg-white shadow-sm
      ${isMobile ? 'rounded-none border-x-0' : 'rounded-lg border'}
      ${isMobile ? 'mx-0' : 'mx-auto'}
      max-w-[calc(100vw-1rem)]
      lg:max-w-none
    `}>
      {/* Header Section */}
      <div className={`
        border-b
        ${isMobile ? 'p-3' : 'p-6'}
      `}>
        {/* Title Section */}
        <div className={`
          ${isMobile ? 'mb-3' : 'mb-4'}
          text-left
        `}>
          <h3 className={`
            font-semibold
            ${isMobile ? 'text-base' : 'text-lg'}
          `}>
            Purchase Order Preview
          </h3>
          <p className={`
            text-gray-500
            ${isMobile ? 'text-xs' : 'text-sm'}
          `}>
              {isEditing ? 'Edit mode - Make changes to the order details' : 'Review mode - Verify order details'}
            </p>
          </div>

        <div className={`
          flex flex-row flex-wrap gap-2
          ${isMobile ? 'justify-start' : 'justify-end ml-2'}
        `}>
            {!isEditing ? (
              <>
              <Button
                variant="outline"
                size={isMobile ? "sm" : "default"}
                onClick={() => setIsEditing(true)}
                disabled={isProcessing}
                className={`
                  ${isMobile ? 'text-xs px-2 py-1 h-8' : ''}
                  flex items-center
                `}
              >
                  <Edit2 className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowInventoryTable(true)}
                  className="flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                size={isMobile ? "sm" : "default"}
                onClick={handleSave}
                disabled={isProcessing}
                className={`
                  ${isMobile ? 'text-xs px-2 py-1 h-8' : ''}
                  flex items-center
                `}
              >
                <Save className="w-4 h-4 mr-1" />
                Save
              </Button>
            )}
            {!isEditing && (
            <Button
              variant="default"
              size={isMobile ? "sm" : "default"}
              onClick={handleProcess}
              disabled={isProcessing || isEditing}
              className={`
                ${isMobile ? 'text-xs px-2 py-1 h-8 bg-purple-600 hover:bg-purple-700' : ''}
                flex items-center
              `}
            >
                {isProcessing ? (
                  <>Processing...</>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Process
                  </>
                )}
              </Button>
            )}
          </div>

        {/* Processing Status */}
        {isProcessing && (
          <Alert className={`mt-3 ${isMobile ? 'text-sm' : ''}`}>
            <AlertCircle className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
            <AlertTitle className={isMobile ? 'text-sm' : ''}>Processing Purchase Order</AlertTitle>
            <AlertDescription className={isMobile ? 'text-xs' : ''}>
              Please wait while we process your order...
            </AlertDescription>
          </Alert>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <Alert variant="destructive" className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Validation Issues</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-4 mt-2">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Items Table */}
        <div className={`
          mt-4 overflow-x-auto 
          ${isMobile ? '-mx-3 px-3' : ''}
        `}>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className={`${isMobile ? 'px-2' : 'px-4'} py-2 text-left whitespace-nowrap`}>Product</th>
                <th className={`${isMobile ? 'px-2' : 'px-4'} py-2 text-left whitespace-nowrap`}>SKU</th>
                <th className={`${isMobile ? 'px-2' : 'px-4'} py-2 text-right whitespace-nowrap`}>Qty</th>
                <th className={`${isMobile ? 'px-2' : 'px-4'} py-2 text-right whitespace-nowrap`}>Price (RM)</th>
                <th className={`${isMobile ? 'px-2' : 'px-4'} py-2 text-right whitespace-nowrap`}>Total (RM)</th>
                {isEditing && <th className="px-2 py-2 text-center">Actions</th>}
              </tr>
            </thead>
              <tbody className="divide-y divide-gray-200">
                {modifiedData.items.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className={`${isMobile ? 'px-2' : 'px-4'} py-2`}>
                      {isEditing ? (
                        <Input
                          value={item.productName}
                          onChange={(e) => handleEdit(index, 'productName', e.target.value)}
                          className={`${isMobile ? 'max-w-[120px]' : 'max-w-[200px]'}`}
                        />
                      ) : item.productName}
                    </td>
                    <td className="px-4 py-2">{item.sku}</td>
                    <td className="px-4 py-2 text-right">
                      {isEditing ? (
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleEdit(index, 'quantity', e.target.value)}
                          min="1"
                          className="max-w-[80px] ml-auto"
                        />
                      ) : item.quantity}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {isEditing ? (
                        <Input
                          type="number"
                          value={item.price}
                          onChange={(e) => handleEdit(index, 'price', e.target.value)}
                          step="0.01"
                          min="0.01"
                          className="max-w-[100px] ml-auto"
                        />
                      ) : parseFloat(item.price).toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {(item.quantity * item.price).toFixed(2)}
                    </td>
                    {isEditing && (
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            <tfoot className="bg-gray-50 font-medium">
              <tr>
                <td colSpan={isEditing ? 4 : 3} className="px-4 py-2 text-right">Subtotal:</td>
                <td className="px-4 py-2 text-right">{totals.subtotal.toFixed(2)}</td>
                {isEditing && <td />}
              </tr>
              <tr>
                <td colSpan={isEditing ? 4 : 3} className="px-4 py-2 text-right">Tax (6%):</td>
                <td className="px-4 py-2 text-right">{totals.tax.toFixed(2)}</td>
                {isEditing && <td />}
              </tr>
              <tr>
                <td colSpan={isEditing ? 4 : 3} className="px-4 py-2 text-right">Shipping:</td>
                <td className="px-4 py-2 text-right">{totals.shipping.toFixed(2)}</td>
                {isEditing && <td />}
              </tr>
              <tr className="text-lg">
                <td colSpan={isEditing ? 4 : 3} className="px-4 py-2 text-right">Total:</td>
                <td className="px-4 py-2 text-right font-bold">{totals.total.toFixed(2)}</td>
                {isEditing && <td />}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Add Item Dialog */}
      <Dialog open={showInventoryTable} onOpenChange={setShowInventoryTable}>
        <DialogContent className="max-w-4xl bg-white">
          <Card className="border-0 shadow-none">
            <CardHeader>
              <CardTitle>Select Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search items..."
                    className="w-full p-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={handleSearch}
                  />
                </div>
                <div className="h-[500px] overflow-y-auto">
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {inventoryItems
                        .filter(item => 
                          item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.sku_number.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((item) => (
                          <button
                            key={item.product_uuid}
                            onClick={() => handleItemSelect(item)}
                            className={`w-full text-left p-4 rounded-lg border transition-colors ${
                              item.product_stock <= 0 
                                ? 'border-red-200 bg-red-50 cursor-not-allowed'
                                : 'border-gray-200 hover:border-blue-500'
                            }`}
                            disabled={item.product_stock <= 0}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium">{item.product_name}</div>
                                <div className="text-sm text-gray-500">
                                  SKU: {item.sku_number}
                                  {item.brand && ` • Brand: ${item.brand}`}
                                </div>
                                <div className="text-sm text-gray-500">
                                  Manufacturer: {item.manufacturer || 'N/A'}
                                </div>
                                <div className="text-sm mt-1">
                                  Current Stock: {item.product_stock} units
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium text-blue-600">
                                  Cost: MYR {typeof item.cost === 'number' ? 
                                    item.cost.toFixed(2) : 
                                    parseFloat(item.cost || 0).toFixed(2)}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchaseOrderPreview;