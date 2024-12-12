import React from 'react';
import { 
  Bot, 
  AlertCircle, 
  FileText, 
  Package, 
  Calculator,
  CheckCircle 
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import ChatbotProcessing from './purchase_order_automation/chatbotProcessing';
import { PurchaseOrderProvider } from './purchase_order_automation/purchaseOrderContext';

const BotMessage = ({ 
  text, 
  data,
  suggestions,
  intent,
  metrics,
  fileAnalysis,
  analysisResult, 
  isError,
  onActionClick,
  onProcessingComplete,
  onProcessingCancel
}) => {

  // Function to render the appropriate analysis view based on the data
  const renderAnalysisView = () => {
    // First, add defensive checks
    if (!fileAnalysis && !analysisResult) {
      console.log('No analysis data available');
      return null;
    }

    if (fileAnalysis?.status?.completed || analysisResult?.status?.completed) {
      return null;
    }

    if (analysisResult) {
      return (
        <PurchaseOrderProvider>
          <ChatbotProcessing
            analysisResult={analysisResult}
            onProcessingComplete={(result) => {
              // Update the fileAnalysis in the message
              if (onProcessingComplete) {
                onProcessingComplete(result);
              }
            }}
            onProcessingCancel={onProcessingCancel}
          />
        </PurchaseOrderProvider>
      );
    }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          Initial Purchase Order Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Simple Document Overview */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-2">
            <Package className="h-5 w-5 text-blue-600 mt-1" />
            <div>
              <h4 className="font-medium text-blue-900">Document Summary</h4>
              <p className="text-sm text-blue-700">
                Purchase Order from {fileAnalysis.metadata.vendorName}
              </p>
              <p className="text-sm text-blue-700">
                Date: {fileAnalysis.metadata.poDate}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-500">Total Items</h4>
            <p className="text-2xl font-semibold">
              {fileAnalysis.extractedItems.length}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-500">Total Amount</h4>
            <p className="text-2xl font-semibold">
              RM{fileAnalysis.financials.grandTotal.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Status Alert */}
        <Alert
          variant={fileAnalysis.status.requiresProductCreation ? "warning" : "success"}
          className="mt-4"
        >
          <AlertTitle>
            {fileAnalysis.status.requiresProductCreation 
              ? `${fileAnalysis.items.newProducts.length} New Products Detected`
              : "Ready to Process"
            }
          </AlertTitle>
          <AlertDescription>
            {fileAnalysis.status.requiresProductCreation 
              ? "These products need to be added to inventory first."
              : "All products exist in inventory. Ready to create purchase order."
            }
          </AlertDescription>
        </Alert>

        {/* Action Button */}
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onProcessingCancel}
          >
            Cancel
          </Button>
          <Button
            onClick={() => onActionClick({
              type: fileAnalysis.status.requiresProductCreation 
                ? 'start_product_creation' 
                : 'start_purchase_order',
              data: fileAnalysis
            })}
          >
            {fileAnalysis.status.requiresProductCreation 
              ? "Add New Products" 
              : "Create Purchase Order"
            }
          </Button>
        </div>
      </CardContent>
    </Card>
  );
  };

  const renderMetrics = () => {
    if (!metrics) return null;

    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-600" />
            Analysis Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Render different metric types based on intent */}
          {intent?.category === 'INVENTORY' && (
            <div className="space-y-4">
              {metrics.stock_levels && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-500">Total Products</h4>
                    <p className="text-2xl font-semibold">{metrics.stock_levels.totalProducts}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-500">Total Value</h4>
                    <p className="text-2xl font-semibold">
                      RM{metrics.stock_levels.totalValue.toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
              {metrics.low_stock && metrics.low_stock.length > 0 && (
                <Alert variant="warning">
                  <AlertTitle>Low Stock Items</AlertTitle>
                  <AlertDescription>
                    {metrics.low_stock.map(item => (
                      <div key={item.sku} className="flex justify-between items-center">
                        <span>{item.name}</span>
                        <span className="font-medium">{item.stock} units</span>
                      </div>
                    ))}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Render suggestions if present
  const renderSuggestions = () => {
    if (!suggestions?.length) return null;

    return (
      <div className="mt-4 flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => onActionClick(suggestion)}
          >
            {suggestion.text}
          </Button>
        ))}
      </div>
    );
  };

  return (
    <div className="flex items-start gap-3 max-w-[80%]"> 
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
        <Bot className="w-5 h-5 text-purple-600" />
      </div>

      <div className="flex-1 space-y-4">
        {text && (
          <div className={`px-3 py-2 rounded-2xl rounded-tl-none inline-block ${
            isError ? 'bg-red-50 text-red-600' : 'bg-gray-100'
          }`}>
            <div className="text-sm whitespace-pre-wrap">{text}</div>
          </div>
        )}

        {isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{text}</AlertDescription>
          </Alert>
        )}
        
        {renderMetrics()}
        {renderSuggestions()}
        {renderAnalysisView()}
      </div>
    </div>
  );
};

export default BotMessage;