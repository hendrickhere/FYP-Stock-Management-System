import React, { useState, useEffect } from 'react';
import { AlertCircle, Check, Edit2, Save, AlertTriangle, Plus, X } from 'lucide-react';
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "../../ui/alert";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../ui/dialog";

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
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);

    useEffect(() => {
        const items = modifiedData.items;
        const subtotal = calculateSubtotal(items);
        const tax = subtotal * 0.06;
        const total = subtotal + tax + modifiedData.financials.shipping;

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
    
    data.items?.forEach((item, index) => {
      if (!item.productName) {
        errors.push(`Item ${index + 1}: Product name is required`);
      }
      if (!item.sku) {
        errors.push(`Item ${index + 1}: SKU is required`);
      }
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Valid quantity is required`);
      }
      if (!item.price || item.price <= 0) {
        errors.push(`Item ${index + 1}: Valid price is required`);
      }
    });

    return errors;
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
    try {
      const errors = validateData(modifiedData);
      if (errors.length > 0) {
        setValidationErrors(errors);
        return;
      }
      
      setIsEditing(false);
      setValidationErrors([]);

      try {
        onModify(modifiedData);
      } catch (error) {
        console.warn('Error in onModify callback:', error);
        setValidationErrors(['Changes saved locally but failed to sync']);
      }
    } catch (error) {
      console.error('Error in handleSave:', error);
      setValidationErrors(['Failed to save changes']);
    }
  };

  // Handler for adding new item
  const handleAddItem = () => {
    if (!newItem.productName || !newItem.sku || !newItem.quantity || !newItem.price) {
      setValidationErrors(['All fields are required for new items']);
      return;
    }

    setModifiedData(prev => ({
      ...prev,
      items: [...prev.items, { ...newItem }]
    }));

    setNewItem({
      productName: '',
      sku: '',
      quantity: '',
      price: ''
    });
    setShowAddItemDialog(false);
  };

  // Handler for removing items
  const handleRemoveItem = (index) => {
    setModifiedData(prev => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index)
    }));
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
                  size={isMobile ? "sm" : "default"}
                  onClick={() => setShowAddItemDialog(true)}
                  disabled={isProcessing || !isEditing}
                  className={`
                    ${isMobile ? 'text-xs px-2 py-1 h-8' : ''}
                    flex items-center
                  `}
                >
                  <Plus className="w-4 h-4 mr-1" />
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
              onClick={() => onConfirm(modifiedData)}
              disabled={isProcessing}
              className={`
                ${isMobile ? 'text-xs px-2 py-1 h-8 bg-purple-600 hover:bg-purple-700' : ''}
                flex items-center
              `}
            >
                <Check className="w-4 h-4 mr-1" />
                Confirm & Process
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
      <Dialog open={showAddItemDialog} onOpenChange={setShowAddItemDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Item</DialogTitle>
            <DialogDescription>
              Enter the details for the new item below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-sm font-medium">Product Name</label>
                <Input
                  value={newItem.productName}
                  onChange={(e) => setNewItem(prev => ({ ...prev, productName: e.target.value }))}
                  placeholder="Enter product name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">SKU</label>
                <Input
                  value={newItem.sku}
                  onChange={(e) => setNewItem(prev => ({ ...prev, sku: e.target.value }))}
                  placeholder="Enter SKU"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Quantity</label>
                <Input
                  type="number"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem(prev => ({ ...prev, quantity: e.target.value }))}
                  placeholder="Enter quantity"
                  min="1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Unit Price (RM)</label>
                <Input
                  type="number"
                  value={newItem.price}
                  onChange={(e) => setNewItem(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="Enter unit price"
                  step="0.01"
                  min="0.01"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAddItemDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddItem}>
              Add Item
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchaseOrderPreview;