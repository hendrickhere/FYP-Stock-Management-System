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
  onConfirm,
  onModify,
  isProcessing = false
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

  const renderItemRow = (item, index) => (
      <tr key={index}>
          <td>{item.productName}</td>
          <td>{item.sku}</td>
          <td className="text-right">{item.quantity}</td>
          <td className="text-right">
              {parseFloat(item.price).toFixed(2)}
          </td>
          <td className="text-right">
              {(parseFloat(item.price) * parseInt(item.quantity)).toFixed(2)}
          </td>
      </tr>
  );

  const ValidationStatus = ({ status, onRetry }) => {
    const getStatusColor = (type) => {
      switch (type) {
        case 'success': return 'bg-green-50 text-green-700 border-green-200';
        case 'warning': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
        case 'error': return 'bg-red-50 text-red-700 border-red-200';
        default: return 'bg-gray-50 text-gray-700 border-gray-200';
      }
    };

    return (
      <div className={`p-4 rounded-lg border ${getStatusColor(status.type)} mb-4`}>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <h4 className="font-medium">{status.title}</h4>
        </div>
        <p className="mt-1 text-sm">{status.message}</p>
        {status.type === 'error' && onRetry && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry}
            className="mt-2"
          >
            Retry Validation
          </Button>
        )}
      </div>
    );
  };

  const validateBusinessRules = (data) => {
    const errors = [];
    
    // Rule: All products must exist in inventory
    data.items?.forEach(item => {
      if (!item.inventoryVerified) {
        errors.push(`Item ${item.productName} must exist in inventory`);
      }
    });
    
    // Rule: Stock updates only through PO status changes
    if (data.hasStockUpdates && data.status !== 'delivered') {
      errors.push('Stock can only be updated when PO status changes to delivered');
    }
    
    // Rule: Product creation requires verification
    if (data.newProducts?.length > 0 && !data.verificationComplete) {
      errors.push('New products require verification before proceeding');
    }
    
    return errors;
  };

  // Helper function to calculate totals and validate data
  const calculateTotals = (items) => {
    const totals = items.reduce((acc, item) => ({
      quantity: acc.quantity + Number(item.quantity || 0),
      subtotal: acc.subtotal + (Number(item.price || 0) * Number(item.quantity || 0))
    }), { quantity: 0, subtotal: 0 });

    return {
      ...totals,
      tax: totals.subtotal * 0.06,
      shipping: 500, // Default shipping fee
      total: (totals.subtotal * 1.06) + 500
    };
  };

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
    const errors = validateData(modifiedData);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setIsEditing(false);
    setValidationErrors([]);
    onModify(modifiedData);
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
    <div className="rounded-lg border bg-white shadow-sm">
      {/* Header Section */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Purchase Order Preview</h3>
            <p className="text-sm text-gray-500">
              {isEditing ? 'Edit mode - Make changes to the order details' : 'Review mode - Verify order details'}
            </p>
          </div>
          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  disabled={isProcessing}
                >
                  <Edit2 className="w-4 h-4 mr-1" />
                  Edit Details
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddItemDialog(true)}
                  disabled={isProcessing || !isEditing}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Item
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                disabled={isProcessing}
              >
                <Save className="w-4 h-4 mr-1" />
                Save Changes
              </Button>
            )}
            {!isEditing && (
              <Button
                variant="default"
                size="sm"
                onClick={() => onConfirm(modifiedData)}
                disabled={isProcessing || validationErrors.length > 0}
              >
                <Check className="w-4 h-4 mr-1" />
                Confirm & Process
              </Button>
            )}
          </div>
        </div>

        {/* Processing Status */}
        {isProcessing && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Processing Purchase Order</AlertTitle>
            <AlertDescription>
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
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Product</th>
                <th className="px-4 py-2 text-left">SKU</th>
                <th className="px-4 py-2 text-right">Quantity</th>
                <th className="px-4 py-2 text-right">Unit Price (RM)</th>
                <th className="px-4 py-2 text-right">Total (RM)</th>
                {isEditing && <th className="px-4 py-2 text-center">Actions</th>}
              </tr>
            </thead>
              <tbody className="divide-y">
                {modifiedData.items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2">
                      {isEditing ? (
                        <Input
                          value={item.productName}
                          onChange={(e) => handleEdit(index, 'productName', e.target.value)}
                          className="max-w-[200px]"
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