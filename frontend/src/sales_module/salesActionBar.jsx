import React, { useEffect, useState } from 'react';
import { FileText, FileSpreadsheet, Receipt, RotateCcw, Plus, Download } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";

const SalesActionBar = ({ 
  selectedOrders = [], 
  onCreateNew,
  onGenerateInvoice,
  onGenerateQuotation,
  onGenerateReceipt,
  onReturnProduct,
  onHighlightSelections,
  isMobile = false,
}) => {
  const isBulkActionsEnabled = selectedOrders.length > 0;
  const isReturnEnabled = selectedOrders.length === 1;
  const [isHighlightingSelections, setIsHighlightingSelections] = useState(false);

  // Validation functions
  const validateDocumentGeneration = () => {
    if (selectedOrders.length === 0) {
      toast.error('Please select at least one sales order to generate documents', {
        duration: 4000,
        position: 'bottom-right',
      });
      onHighlightSelections(true);
      return false;
    }
    if (selectedOrders.length > 5) {
      toast.error('You can only generate documents for up to 5 sales orders at a time', {
        duration: 4000,
        position: 'bottom-right',
      });
      onHighlightSelections(true);
      return false;
    }
    return true;
  };

  const validateReturnProduct = () => {
    if (selectedOrders.length === 0) {
      toast.error('Please select a sales order to process return', {
        duration: 4000,
        position: 'bottom-right',
      });
      onHighlightSelections(true);
      return false;
    }
    if (selectedOrders.length > 1) {
      toast.error('You can only process return for one sales order at a time', {
        duration: 4000,
        position: 'bottom-right',
      });
      onHighlightSelections(true);
      return false;
    }
    return true;
  };

  // Handle document generation
  const handleGenerateInvoice = () => {
    if (validateDocumentGeneration()) {
      onGenerateInvoice();
    }
  };

  const handleGenerateQuotation = () => {
    if (validateDocumentGeneration()) {
      onGenerateQuotation();
    }
  };

  const handleGenerateReceipt = () => {
    if (validateDocumentGeneration()) {
      onGenerateReceipt();
    }
  };

  // Handle return product
  const handleReturnProduct = () => {
    if (validateReturnProduct()) {
      onReturnProduct();
    }
  };

  return (
    <div className="border-b border-gray-200">
      <Toaster position="bottom-right" />
      
      <div className="flex items-center justify-between p-4 gap-4 pl-0">
        <div className="flex items-center gap-4 flex-wrap">
          <Button
            variant="default"
            className="flex items-center space-x-2 px-4 py-2 bg-white text-green-700 font-medium rounded-lg shadow hover:bg-green-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75"
            onClick={onCreateNew}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Order
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className={`${selectedOrders.length > 0 ? "" : "opacity-50"}`}
              >
                <Download className="w-4 h-4 mr-2" />
                Generate Documents
                {selectedOrders.length > 0 && 
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    selectedOrders.length > 5 ? 'bg-red-100 text-red-600' : 'bg-gray-100'
                  }`}>
                    {selectedOrders.length}
                  </span>
                }
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem 
                className="flex items-center"
                onClick={handleGenerateInvoice}
              >
                <FileText className="w-4 h-4 mr-2" />
                Generate Invoice
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="flex items-center"
                onClick={handleGenerateQuotation}
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Generate Quotation
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="flex items-center"
                onClick={handleGenerateReceipt}
              >
                <Receipt className="w-4 h-4 mr-2" />
                Generate Receipt
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            className={`border-orange-600 text-orange-600 hover:bg-orange-50 ${
              selectedOrders.length === 1 ? "" : "opacity-50"
            }`}
            onClick={handleReturnProduct}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Return Product
            {selectedOrders.length > 0 && 
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                selectedOrders.length !== 1 ? 'bg-red-100 text-red-600' : 'bg-gray-100'
              }`}>
                {selectedOrders.length}
              </span>
            }
          </Button>
        </div>

        {selectedOrders.length > 0 && (
          <div className={`text-sm ${
            (selectedOrders.length > 5 || (selectedOrders.length > 1 && isHighlightingSelections)) 
            ? 'text-red-600' 
            : 'text-gray-600'
          }`}>
            {selectedOrders.length} order{selectedOrders.length > 1 ? 's' : ''} selected
            {selectedOrders.length > 5 && ' (maximum 5 allowed)'}
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesActionBar;