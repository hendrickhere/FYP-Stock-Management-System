import React, { useState } from 'react';
import { 
  Card,
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter 
} from "../../ui/card";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { AlertCircle, Package, ArrowRight, Save } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "../../ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "../../ui/dialog";

const StockReviewForm = ({ 
  insufficientStock, 
  onStockUpdate,
  onQuantityModification,
  onCancel 
}) => {
  // Initialize state for both stock updates and order modifications
  const [items, setItems] = useState(
    insufficientStock.map(item => ({
      ...item,
      newStockLevel: item.currentStock || 0,
      modifiedOrderQuantity: item.requestedQuantity,
      isUpdatingStock: false, // Track which update method user chose
      errors: {},
      isDirty: false
    }))
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [activeUpdateType, setActiveUpdateType] = useState(null);

  // Validation function
  const validateItem = (item) => {
    const errors = {};
    
    if (item.isUpdatingStock) {
      if (isNaN(item.newStockLevel) || item.newStockLevel < 0) {
        errors.newStockLevel = 'Stock level must be a valid positive number';
      }
      if (item.newStockLevel < item.requestedQuantity) {
        errors.newStockLevel = 'New stock level must meet order quantity';
      }
    } else {
      if (isNaN(item.modifiedOrderQuantity) || item.modifiedOrderQuantity <= 0) {
        errors.modifiedOrderQuantity = 'Order quantity must be a valid positive number';
      }
      if (item.modifiedOrderQuantity > item.currentStock) {
        errors.modifiedOrderQuantity = 'Modified quantity exceeds available stock';
      }
    }
    
    return errors;
  };

  // Handle input changes for both stock and order quantity
  const handleInputChange = (index, field, value) => {
    setItems(prevItems => {
      const updatedItems = [...prevItems];
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value,
        isDirty: true,
        errors: {
          ...updatedItems[index].errors,
          [field]: null
        }
      };
      return updatedItems;
    });
  };

  // Toggle between stock update and order modification
  const toggleUpdateMethod = (index) => {
    setItems(prevItems => {
      const updatedItems = [...prevItems];
      updatedItems[index] = {
        ...updatedItems[index],
        isUpdatingStock: !updatedItems[index].isUpdatingStock,
        errors: {}
      };
      return updatedItems;
    });
  };

  // Prepare and validate submission
  const prepareSubmission = (type) => {
    setActiveUpdateType(type);
    
    // Validate all items
    const itemsWithValidation = items.map(item => ({
      ...item,
      errors: validateItem(item)
    }));

    // Check if any items have errors
    const hasErrors = itemsWithValidation.some(
      item => Object.keys(item.errors).length > 0
    );

    if (hasErrors) {
      setItems(itemsWithValidation);
      setGlobalError('Please fix the validation errors before proceeding');
      return;
    }

    setShowConfirmDialog(true);
  };

  // Handle final submission
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setGlobalError(null);

      const updatedData = items.map(item => ({
        sku: item.sku,
        productName: item.productName,
        currentStock: item.currentStock,
        requestedQuantity: item.requestedQuantity,
        newStockLevel: item.isUpdatingStock ? parseInt(item.newStockLevel) : item.currentStock,
        modifiedOrderQuantity: !item.isUpdatingStock ? parseInt(item.modifiedOrderQuantity) : item.requestedQuantity
      }));

      if (activeUpdateType === 'stock') {
        await onStockUpdate(updatedData);
      } else {
        await onQuantityModification(updatedData);
      }

      setShowConfirmDialog(false);
    } catch (error) {
      setGlobalError(error.message);
      console.error('Error updating stock/quantities:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {globalError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{globalError}</AlertDescription>
        </Alert>
      )}

      {items.map((item, index) => (
        <Card key={index}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>{item.productName}</CardTitle>
                <CardDescription>SKU: {item.sku}</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleUpdateMethod(index)}
              >
                {item.isUpdatingStock ? 'Modify Order Instead' : 'Update Stock Instead'}
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-500">Current Stock</div>
                  <div className="mt-1 text-2xl font-semibold">
                    {item.currentStock.toLocaleString()} units
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-500">Requested Quantity</div>
                  <div className="mt-1 text-2xl font-semibold">
                    {item.requestedQuantity.toLocaleString()} units
                  </div>
                </div>
              </div>

              {item.isUpdatingStock ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium">New Stock Level</label>
                  <Input
                    type="number"
                    value={item.newStockLevel}
                    onChange={(e) => handleInputChange(index, 'newStockLevel', e.target.value)}
                    className={item.errors?.newStockLevel ? 'border-red-500' : ''}
                    min="0"
                  />
                  {item.errors?.newStockLevel && (
                    <p className="text-sm text-red-500">{item.errors.newStockLevel}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Modified Order Quantity</label>
                  <Input
                    type="number"
                    value={item.modifiedOrderQuantity}
                    onChange={(e) => handleInputChange(index, 'modifiedOrderQuantity', e.target.value)}
                    className={item.errors?.modifiedOrderQuantity ? 'border-red-500' : ''}
                    min="0"
                  />
                  {item.errors?.modifiedOrderQuantity && (
                    <p className="text-sm text-red-500">{item.errors.modifiedOrderQuantity}</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          onClick={() => prepareSubmission('stock')}
          disabled={isSubmitting || !items.some(item => item.isUpdatingStock)}
        >
          Update Stock Levels
        </Button>
        <Button
          onClick={() => prepareSubmission('order')}
          disabled={isSubmitting || !items.some(item => !item.isUpdatingStock)}
        >
          Modify Order Quantities
        </Button>
      </div>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm {activeUpdateType === 'stock' ? 'Stock Update' : 'Order Modification'}</DialogTitle>
            <DialogDescription>
              {activeUpdateType === 'stock' 
                ? 'Are you sure you want to update the stock levels? This action will affect your inventory.'
                : 'Are you sure you want to modify the order quantities? This will update the purchase order.'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-4">
              {items
                .filter(item => 
                  activeUpdateType === 'stock' ? item.isUpdatingStock : !item.isUpdatingStock
                )
                .map((item, index) => (
                  <div key={index} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <div className="font-medium">{item.productName}</div>
                      <div className="text-sm text-gray-500">SKU: {item.sku}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">
                        {item.currentStock} units
                      </span>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">
                        {activeUpdateType === 'stock' 
                          ? item.newStockLevel 
                          : item.modifiedOrderQuantity} units
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StockReviewForm;