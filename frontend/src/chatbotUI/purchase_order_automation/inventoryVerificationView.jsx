import React, { useState, useEffect } from 'react';
import { 
  Card,
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "../../ui/card";
import toast from 'react-hot-toast';
import { AlertCircle, Check, AlertTriangle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "../../ui/alert";
import { Button } from "../../ui/button";

const InventoryVerificationView = ({ 
  analysisResult,
  onContinue,
  onCancel
}) => {
  // Separate products into categories based on verification results
  const {
    existingProducts = [],
    newProducts = []
  } = analysisResult.groupedItems;

  const [verificationComplete, setVerificationComplete] = useState(false);

  const handleContinue = () => {
    if (newProducts.length > 0 && !verificationComplete) {
      toast({
        title: "Verification Required",
        description: "Please verify all new products before continuing",
        variant: "warning"
      });
      return;
    }
    onContinue();
  };

  const trackVerificationStatus = () => {
    const isComplete = newProducts.every(product => product.verified);
    setVerificationComplete(isComplete);
  };

  const renderProductList = (products, type) => {
    if (products.length === 0) return null;

    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {type === 'existing' ? (
              <>
                <Check className="h-5 w-5 text-green-500" />
                Verified Products
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                New Products to Create
              </>
            )}
          </CardTitle>
          <CardDescription>
            {type === 'existing' 
              ? 'These products exist in your inventory and are ready for order processing'
              : 'These products will be created with zero initial stock'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {products.map((product, index) => (
              <div 
                key={product.sku || index} 
                className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <div className="font-medium">{product.productName}</div>
                  <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    Quantity: {product.quantity}
                  </div>
                  <div className="text-sm text-gray-500">
                    Unit Price: RM{parseFloat(product.price).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Alert */}
      <Alert
        variant={newProducts.length > 0 ? "warning" : "success"}
        className="mb-6"
      >
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Inventory Verification Results</AlertTitle>
        <AlertDescription>
          Found {existingProducts.length} existing products and {newProducts.length} new products to create.
          {newProducts.length > 0 && " New products will be created with zero initial stock."}
        </AlertDescription>
      </Alert>

      {/* Existing Products Section */}
      {renderProductList(existingProducts, 'existing')}

      {/* New Products Section */}
      {renderProductList(newProducts, 'new')}

      {/* Action Buttons */}
      <div className="flex justify-end gap-4 mt-6">
        <Button
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          onClick={onContinue}
        >
          {newProducts.length > 0 
            ? 'Continue to Product Creation' 
            : 'Continue to Order Review'
          }
        </Button>
      </div>
    </div>
  );
};

export default InventoryVerificationView;