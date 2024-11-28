import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  AlertCircle, 
  FileText, 
  Package, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  CheckCircle,
  Calculator 
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import PurchaseOrderPreview from './purchaseOrderPreview';
import axiosInstance from '../axiosConfig';
import { InventoryInsights } from './inventoryInsights';
import { Button } from '../ui/button';
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "../ui/card";

const BotMessage = ({ 
  text, 
  data, 
  isError, 
  fileAnalysis, 
  showPreview,
  actions 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null); 
  const [isTimedOut, setIsTimedOut] = useState(false);

  const handleError = (errorMessage) => {
    setError(errorMessage);
    setIsProcessing(false);
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isProcessing) {
        setIsTimedOut(true);
        setIsProcessing(false);
        setError('Request timed out. Please try again.');
      }
    }, 30000); // 30 second timeout

    return () => clearTimeout(timeout);
  }, [isProcessing]);

  if (isTimedOut) {
    return <Alert variant="destructive">Request timed out. Please try again.</Alert>;
  }

    const handleConfirmPO = async (data) => {
    setIsProcessing(true);
    try {
      const purchaseOrderData = {
        vendorId: data.vendor?.id || "VEN-001",
        orderDate: data.metadata?.date || new Date().toISOString(),
        paymentTerms: data.metadata?.paymentTerms || "Net 30",
        deliveryMethod: data.metadata?.deliveryMethod || "Standard Shipping",
        items: data.items.map(item => ({
          productId: item.id,
          quantity: parseInt(item.quantity),
          price: parseFloat(item.price)
        }))
      };

      const response = await axiosInstance.post('/purchase/create', purchaseOrderData);
      return response.data;
    } catch (error) {
      setError(error.message || 'Error processing purchase order');
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSend = async (message) => {
  try {
    setIsProcessing(true);
    const response = await axiosInstance.post('/chat', { message });
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to get response');
    }
    // Handle success
  } catch (error) {
    setError(error.message);
  } finally {
    setIsProcessing(false);
  }
};

  const DocumentAnalysisCard = ({ analysis }) => {
    const { documentType, extractedData, validationResults } = analysis;
    const totalValue = extractedData.items?.reduce((sum, item) => 
      sum + (parseFloat(item.price) * parseInt(item.quantity)), 0
    ) || 0;

    return (
      <Alert className="bg-blue-50 border-blue-200">
        <FileText className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800">{documentType} Analysis</AlertTitle>
        <AlertDescription>
          {/* Vendor Section */}
          {extractedData.vendor && (
            <div className="mt-2">
              <h4 className="font-medium">Vendor Details</h4>
              <div className="grid grid-cols-2 gap-2 mt-1 text-sm">
                <span>Name:</span><span>{extractedData.vendor.name}</span>
                {extractedData.vendor.contact && (
                  <><span>Contact:</span><span>{extractedData.vendor.contact}</span></>
                )}
              </div>
            </div>
          )}

          {/* Items Section */}
          {extractedData.items?.length > 0 && (
            <div className="mt-4">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-2 py-1 text-left text-xs font-medium">Item</th>
                    <th className="px-2 py-1 text-right text-xs font-medium">Qty</th>
                    <th className="px-2 py-1 text-right text-xs font-medium">Price</th>
                    <th className="px-2 py-1 text-right text-xs font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {extractedData.items.map((item, idx) => (
                    <tr key={idx} className={validationResults.warnings?.some(w => w.item === item.name) ? 'bg-yellow-50' : ''}>
                      <td className="px-2 py-1 text-sm">{item.name}</td>
                      <td className="px-2 py-1 text-sm text-right">{item.quantity}</td>
                      <td className="px-2 py-1 text-sm text-right">RM{item.price.toFixed(2)}</td>
                      <td className="px-2 py-1 text-sm text-right">
                        RM{(item.quantity * item.price).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  <tr className="font-medium">
                    <td colSpan="3" className="px-2 py-1 text-right">Total:</td>
                    <td className="px-2 py-1 text-right">RM{totalValue.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Validation Warnings */}
          {validationResults.warnings?.length > 0 && (
            <div className="mt-3 p-2 bg-yellow-50 rounded text-sm">
              <p className="font-medium text-yellow-800">Please review:</p>
              <ul className="mt-1 space-y-1">
                {validationResults.warnings.map((warning, idx) => (
                  <li key={idx} className="text-yellow-700 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {warning.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </AlertDescription>
      </Alert>
    );
  };

  const renderContent = () => {
    const extractedItems = fileAnalysis?.metadata?.extractedItems;
    const hasFileData = !!extractedItems?.length;

    return (
      <div className="space-y-4">
        {/* Initial Message */}
        <div className={`px-4 py-3 rounded-2xl rounded-tl-none 
          ${isError ? 'bg-red-50 text-red-600' : 'bg-gray-100'}
        `}>
          <div className="text-sm whitespace-pre-wrap">{text}</div>
        </div>

        {/* Error Message if any */}
        {error && (
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800">Error</AlertTitle>
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {/* Purchase Order Preview */}
        {hasFileData && showPreview && renderPurchaseOrderPreview(fileAnalysis)}

        {/* Other Insights */}
        {!hasFileData && data && renderInventoryInsights(data)}
      </div>
    );
  };

  const handleModifyPO = (modifiedData) => {
    console.log('Modified PO data:', modifiedData);
    // Handle the modified data as needed
  };

  const renderOCRResults = () => {
    // Get the extracted items either from data or fileAnalysis
    const extractedItems = fileAnalysis?.metadata?.extractedItems || data?.extractedItems;
    
    if (!extractedItems) return null;

    // Check if we have data but no extracted items
    if (extractedItems.length === 0) {
        return (
            <Alert className="mt-4 bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertTitle className="text-yellow-800">Document Processing</AlertTitle>
                <AlertDescription>
                    No inventory items could be extracted from this document. Please ensure the document contains valid purchase order information.
                </AlertDescription>
            </Alert>
        );
    }

    // If we have extracted items, show the PO preview
    return (
      <div className="mt-4">
        <PurchaseOrderPreview
          extractedData={{
            items: extractedItems.map(item => ({
              productName: item.productName,
              sku: item.sku,
              quantity: item.quantity,
              price: item.price
            }))
          }}
          onConfirm={handleConfirmPO}
          onModify={handleModifyPO}
          isProcessing={isProcessing}
        />
      </div>
    );
  };

  const renderAnalysisAndPreview = () => {
    if (!fileAnalysis?.metadata?.extractedItems) return null;

    return (
      <div className="space-y-4">
        {/* Analysis Section with Warranty Information */}
        <Alert className="bg-blue-50 border-blue-200">
          <FileText className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">Purchase Order Analysis</AlertTitle>
          <AlertDescription>
            <div className="prose prose-sm text-blue-700">
              {/* Products Section */}
              <h4 className="text-blue-900">1. Product Analysis:</h4>
              <div className="space-y-1">
                {fileAnalysis.products.map((product, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span>{product.productName}</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      product.requiresWarranty ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {product.requiresWarranty ? 'Warranty Required' : 'No Warranty Required'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Warranty Section */}
              {fileAnalysis.warranties?.applicableProducts?.length > 0 && (
                <>
                  <h4 className="text-blue-900 mt-4">2. Warranty Requirements:</h4>
                  <div className="space-y-2">
                    {fileAnalysis.warranties.applicableProducts.map((product, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-lg border border-blue-100">
                        <h5 className="font-medium">{product.productName}</h5>
                        <div className="grid grid-cols-2 gap-2 mt-1 text-sm">
                          <div>
                            <span className="font-medium">Manufacturer Warranty:</span>
                            <p>{product.suggestedTerms.manufacturer.terms}</p>
                          </div>
                          <div>
                            <span className="font-medium">Consumer Warranty:</span>
                            <p>{product.suggestedTerms.consumer.terms}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Validation Warnings */}
              {fileAnalysis.validation?.warnings?.length > 0 && (
                <div className="mt-4 bg-yellow-50 p-3 rounded-lg">
                  <h4 className="text-yellow-800 font-medium">Important Notices:</h4>
                  <ul className="mt-1 space-y-1">
                    {fileAnalysis.validation.warnings.map((warning, idx) => (
                      <li key={idx} className="text-yellow-700 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        {warning.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>

        {/* Enhanced Purchase Order Preview */}
        <PurchaseOrderPreview
          extractedData={{
            items: fileAnalysis.metadata.extractedItems,
            warranties: fileAnalysis.warranties,
            validation: fileAnalysis.validation
          }}
          onConfirm={handleConfirmPO}
          onModify={handleModifyPO}
          isProcessing={isProcessing}
        />
      </div>
    );
  };

  const renderInventoryInsights = (data) => {
    if (!data || Object.keys(data).length === 0) return null;

    return (
      <div className="mt-4 space-y-4">
        {data.lowStockItems?.length > 0 && (
          <Alert variant="destructive" className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="text-red-800">Low Stock Alert</AlertTitle>
            <AlertDescription>
              <div className="mt-2 space-y-1">
                {data.lowStockItems.map((item, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-red-600">{item.stock} units left</span>
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {data.expiringItems?.length > 0 && (
          <Alert className="bg-amber-50 border-amber-200">
            <Calendar className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Expiring Products</AlertTitle>
            <AlertDescription>
              <div className="mt-2 space-y-1">
                {data.expiringItems.map((item, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-amber-600">
                      {item.daysRemaining} days remaining
                    </span>
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {typeof data.totalValue === 'number' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Alert className="bg-blue-50 border-blue-200">
              <Package className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800">Total Products</AlertTitle>
              <AlertDescription>
                <span className="text-2xl font-semibold text-blue-600">
                  {data.productCount}
                </span>
                <span className="text-sm text-blue-600 ml-2">items in stock</span>
              </AlertDescription>
            </Alert>

            <Alert className="bg-green-50 border-green-200">
              <DollarSign className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Total Value</AlertTitle>
              <AlertDescription>
                <span className="text-2xl font-semibold text-green-600">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'MYR'
                  }).format(data.totalValue)}
                </span>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {Object.keys(data.categories || {}).length > 0 && (
          <Alert className="bg-purple-50 border-purple-200">
            <TrendingUp className="h-4 w-4 text-purple-600" />
            <AlertTitle className="text-purple-800">Stock Distribution</AlertTitle>
            <AlertDescription>
              <div className="mt-2 space-y-2">
                {Object.entries(data.categories).map(([manufacturer, info]) => (
                  <div key={manufacturer} className="flex justify-between items-center text-sm">
                    <span className="font-medium">{manufacturer}</span>
                    <div className="text-right">
                      <div className="text-purple-600">{info.count} products</div>
                      <div className="text-sm text-purple-500">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'MYR'
                        }).format(info.totalValue)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

const DocumentAnalysis = ({ analysis }) => {
  const { documentType, extractedData, validationResults } = analysis;

  return (
    <div className="space-y-4">
      <Alert className="bg-blue-50 border-blue-200">
        <FileText className="h-4 w-4 text-blue-600" />
        <AlertDescription>
          <h4 className="font-semibold">Document Type: {documentType}</h4>
          
          {/* Vendor Info */}
          {extractedData.vendor && (
            <div className="mt-2">
              <p className="font-medium">Vendor:</p>
              <p>{extractedData.vendor.name}</p>
              {extractedData.vendor.contact && <p>{extractedData.vendor.contact}</p>}
            </div>
          )}

          {/* Items List */}
          {extractedData.items?.length > 0 && (
            <div className="mt-2">
              <p className="font-medium">Items:</p>
              <div className="mt-1 space-y-1">
                {extractedData.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{item.name}</span>
                    <span>{item.quantity} × RM{item.price}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Validation Warnings */}
          {validationResults.warnings?.length > 0 && (
            <div className="mt-3 p-2 bg-yellow-50 rounded">
              <p className="text-yellow-700 font-medium">Warnings:</p>
              <ul className="list-disc pl-4 text-sm">
                {validationResults.warnings.map((warning, idx) => (
                  <li key={idx} className="text-yellow-600">
                    {warning.message} {warning.item && `(${warning.item})`}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </AlertDescription>
      </Alert>

      {/* Action Buttons */}
      {validationResults.suggestedActions && (
        <div className="flex gap-2 justify-end">
          {validationResults.suggestedActions.map((action, idx) => (
            <button 
              key={idx}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
              onClick={() => action.handler()}>
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

  const renderDocumentAnalysis = () => {
    if (!fileAnalysis?.metadata?.extractedItems) return null;

    const items = fileAnalysis.metadata.extractedItems;
    const financials = calculateFinancials(items);

    const hasNewProducts = items.some(item => item.notFound);
    const hasInsufficientStock = items.some(item => item.insufficientStock);

    return (
      <div className="space-y-4 mt-4">
        {/* Products Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Products Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded-lg border ${
                    item.notFound || item.insufficientStock 
                      ? 'bg-amber-50 border-amber-200' 
                      : 'bg-gray-50 border-gray-100'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{item.productName}</h4>
                      <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{item.quantity} units</p>
                      <p className="text-sm text-gray-500">
                        @ RM{parseFloat(item.price).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  {item.notFound && (
                    <div className="mt-2 flex items-center gap-2 text-amber-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      New product - needs to be added to inventory
                    </div>
                  )}
                  {item.insufficientStock && (
                    <div className="mt-2 flex items-center gap-2 text-amber-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      Insufficient stock available
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Financial Summary Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="w-5 h-5 text-green-600" />
              Financial Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">RM{financials.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Tax (6%)</span>
                <span className="font-medium">RM{financials.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium">RM{financials.shipping.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t">
                <span className="font-semibold">Total</span>
                <span className="font-semibold text-lg">
                  RM{financials.total.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Required Section - Only show if there are issues */}
        {(hasNewProducts || hasInsufficientStock) && (
          <Alert className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Action Required</AlertTitle>
            <AlertDescription className="text-amber-700">
              <p className="mt-1">Before processing this purchase order, we need to:</p>
              <ul className="list-disc pl-4 mt-2 space-y-1">
                {hasNewProducts && (
                  <li>Add the new products to your inventory system</li>
                )}
                {hasInsufficientStock && (
                  <li>Address the insufficient stock levels</li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        {actions && actions.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-end mt-4">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || "default"}
                onClick={action.handler}
                className="min-w-[120px]"
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Helper function to calculate financials
  const calculateFinancials = (items) => {
    const subtotal = items.reduce((sum, item) => 
      sum + (parseFloat(item.price) * parseInt(item.quantity)), 0
    );
    const tax = subtotal * 0.06;
    const shipping = 500; // Default shipping fee
    return {
      subtotal,
      tax,
      shipping,
      total: subtotal + tax + shipping
    };
  };

  return (
    <div className="flex items-start gap-3 animate-fadeIn">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
        <Bot className="w-5 h-5 text-purple-600" />
      </div>

      <div className="flex-1 space-y-4">
        {/* Initial Message */}
        <div className={`px-4 py-3 rounded-2xl rounded-tl-none ${
          isError ? 'bg-red-50 text-red-600' : 'bg-gray-100'
        }`}>
          <div className="text-sm whitespace-pre-wrap">{text}</div>
        </div>

        {/* Error Alert */}
        {isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Processing Document</AlertTitle>
            <AlertDescription>
              {text}
            </AlertDescription>
          </Alert>
        )}

        {/* Document Analysis */}
        {fileAnalysis && renderDocumentAnalysis()}

        {/* General Data Display */}
        {data && !fileAnalysis && (
          <Alert className="bg-blue-50 border-blue-200">
            <FileText className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-700">
              {JSON.stringify(data, null, 2)}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );

const renderPurchaseOrderPreview = (fileAnalysis) => {
  if (!fileAnalysis?.metadata?.extractedItems?.length) return null;

  const items = fileAnalysis.metadata.extractedItems;
  const totalValue = items.reduce((sum, item) => 
    sum + (parseFloat(item.price) * parseInt(item.quantity)), 0
  );

  return (
    <div className="space-y-4">
      {/* Analysis Card */}
      <Alert className="bg-blue-50 border-blue-200">
        <FileText className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800">Purchase Order Analysis</AlertTitle>
        <AlertDescription className="space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-blue-900">Items</p>
              <p className="text-2xl font-bold text-blue-700">{items.length}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900">Total Value</p>
              <p className="text-2xl font-bold text-blue-700">
                RM{totalValue.toFixed(2)}
              </p>
            </div>
          </div>
          
          {/* Items Table */}
          <div className="mt-4">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-blue-900">Product</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-blue-900">Qty</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-blue-900">Price</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-blue-900">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-3 py-2 text-sm text-gray-900">{item.productName}</td>
                    <td className="px-3 py-2 text-sm text-right">{item.quantity}</td>
                    <td className="px-3 py-2 text-sm text-right">RM{parseFloat(item.price).toFixed(2)}</td>
                    <td className="px-3 py-2 text-sm text-right">
                      RM{(parseFloat(item.price) * parseInt(item.quantity)).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="3" className="px-3 py-2 text-sm font-medium text-right">Total</td>
                  <td className="px-3 py-2 text-sm font-medium text-right">
                    RM{totalValue.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </AlertDescription>
      </Alert>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <Button
          variant="outline"
          onClick={() => handleModifyPO(fileAnalysis.metadata)}
          className="text-blue-600 border-blue-600 hover:bg-blue-50"
        >
          Edit Details
        </Button>
        <Button
          onClick={() => handleConfirmPO(fileAnalysis.metadata)}
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          Confirm & Process
        </Button>
      </div>
    </div>
  );
};

  return (
    <div className="flex items-start gap-3 animate-fadeIn">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
        <Bot className="w-5 h-5 text-purple-600" />
      </div>

      <div className="flex-1 space-y-4">
        <div className={`px-4 py-3 rounded-2xl rounded-tl-none ${isError ? 'bg-red-50' : 'bg-gray-100'}`}>
          <div className="text-sm whitespace-pre-wrap">{text}</div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {fileAnalysis && <DocumentAnalysisCard analysis={fileAnalysis} />}
        
        {data && <InventoryInsights data={data} />}

        {fileAnalysis?.validationResults?.suggestedActions && (
          <div className="flex justify-end gap-2">
            {fileAnalysis.validationResults.suggestedActions.map((action, idx) => (
              <Button
                key={idx}
                variant={action.type || "default"}
                onClick={action.handler}
                disabled={isProcessing}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BotMessage;