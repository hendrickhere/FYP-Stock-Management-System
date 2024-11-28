import React, { useState } from 'react';
import { AlertCircle, Check, Edit2, Save } from 'lucide-react';
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "../ui/alert"
import { Input } from "../ui/input"
import { Button } from "../ui/button"

const PurchaseOrderPreview = ({ 
  extractedData,
  onConfirm,
  onModify,
  isProcessing = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [modifiedData, setModifiedData] = useState(extractedData);

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

  const handleSave = () => {
    setIsEditing(false);
    onModify(modifiedData);
  };

  const calculateTotals = (items) => {
    return items.reduce((acc, item) => ({
      quantity: acc.quantity + Number(item.quantity),
      total: acc.total + (Number(item.price) * Number(item.quantity))
    }), { quantity: 0, total: 0 });
  };

  const totals = calculateTotals(modifiedData.items || []);

  return (
    <div className="rounded-lg border bg-white shadow-sm">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Purchase Order Preview</h3>
          <div className="flex gap-2">
            {!isEditing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                disabled={isProcessing}
              >
                <Edit2 className="w-4 h-4 mr-1" />
                Edit
              </Button>
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
                disabled={isProcessing}
              >
                <Check className="w-4 h-4 mr-1" />
                Confirm & Process
              </Button>
            )}
          </div>
        </div>

        {isProcessing && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Processing Purchase Order</AlertTitle>
            <AlertDescription>
              Please wait while we process the purchase order...
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Product</th>
                  <th className="px-4 py-2 text-left">SKU</th>
                  <th className="px-4 py-2 text-right">Quantity</th>
                  <th className="px-4 py-2 text-right">Unit Price</th>
                  <th className="px-4 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {modifiedData.items?.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2">
                      {isEditing ? (
                        <Input
                          value={item.productName}
                          onChange={(e) => handleEdit(index, 'productName', e.target.value)}
                          className="max-w-[200px]"
                        />
                      ) : (
                        item.productName
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {isEditing ? (
                        <Input
                          value={item.sku}
                          onChange={(e) => handleEdit(index, 'sku', e.target.value)}
                          className="max-w-[120px]"
                        />
                      ) : (
                        item.sku
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {isEditing ? (
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleEdit(index, 'quantity', e.target.value)}
                          className="max-w-[80px] ml-auto"
                        />
                      ) : (
                        item.quantity
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {isEditing ? (
                        <Input
                          type="number"
                          value={item.price}
                          onChange={(e) => handleEdit(index, 'price', e.target.value)}
                          className="max-w-[100px] ml-auto"
                          step="0.01"
                        />
                      ) : (
                        `RM ${Number(item.price).toFixed(2)}`
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {`RM ${(item.quantity * item.price).toFixed(2)}`}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 font-medium">
                <tr>
                  <td colSpan={2} className="px-4 py-2 text-right">Totals:</td>
                  <td className="px-4 py-2 text-right">{totals.quantity}</td>
                  <td className="px-4 py-2 text-right"></td>
                  <td className="px-4 py-2 text-right">
                    RM {totals.total.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderPreview;