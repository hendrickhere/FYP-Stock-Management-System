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

const BotMessage = ({ 
  text, 
  data,
  fileAnalysis,
  analysisResult, 
  showPreview,
  actions,
  isError,
  onActionClick,
  onProcessingComplete,
  onProcessingCancel
}) => {
  // Function to render the appropriate analysis view based on the data
  const renderAnalysisView = () => {
    if (!fileAnalysis || !showPreview) return null;

    // If we have analysis results and automated processing is active
    if (analysisResult && analysisResult.groupedItems) {
      return (
        <ChatbotProcessing
          analysisResult={analysisResult}
          onProcessingComplete={onProcessingComplete}
          onProcessingCancel={onProcessingCancel}
        />
      );
    }

    // Render initial analysis summary if automation hasn't started
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Purchase Order Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Metadata Section */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Document Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">PO Date:</span>
                <span className="ml-2">{fileAnalysis.metadata.poDate}</span>
              </div>
              <div>
                <span className="text-gray-500">Vendor:</span>
                <span className="ml-2">{fileAnalysis.metadata.vendorName}</span>
              </div>
            </div>
          </div>

          {/* Items Summary */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Items Summary</h4>
            <div className="space-y-2">
              {fileAnalysis.extractedItems.map((item, index) => (
                <div key={index} className="p-2 bg-gray-50 rounded-md">
                  <div className="flex justify-between">
                    <span>{item.productName}</span>
                    <span className="text-gray-600">
                      {item.quantity} × RM{item.price.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Summary */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Financial Summary</h4>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal:</span>
                <span>RM{fileAnalysis.financials.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax (6%):</span>
                <span>RM{fileAnalysis.financials.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Shipping:</span>
                <span>RM{fileAnalysis.financials.shipping.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-medium mt-2">
                <span>Total:</span>
                <span>RM{fileAnalysis.financials.grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {actions?.length > 0 && (
            <div className="flex justify-end gap-2 mt-4">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || 'default'}
                  onClick={() => onActionClick?.(action)}
                  disabled={action.disabled}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex items-start gap-3">
      {/* Bot Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
        <Bot className="w-5 h-5 text-purple-600" />
      </div>

      {/* Message Content */}
      <div className="flex-1 space-y-4">
        {/* Text Message */}
        {text && (
          <div className={`px-4 py-3 rounded-2xl rounded-tl-none ${
            isError ? 'bg-red-50 text-red-600' : 'bg-gray-100'
          }`}>
            <div className="text-sm whitespace-pre-wrap">{text}</div>
          </div>
        )}

        {/* Error Alert */}
        {isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{text}</AlertDescription>
          </Alert>
        )}

        {/* Analysis View */}
        {renderAnalysisView()}
      </div>
    </div>
  );
};

export default BotMessage;