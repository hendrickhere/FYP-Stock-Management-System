import React from 'react';
import { FileText, FileSpreadsheet, Receipt, RotateCcw, Plus, Download } from 'lucide-react';
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
  isMobile = false,
}) => {
  const isBulkActionsEnabled = selectedOrders.length > 0;
  const isReturnEnabled = selectedOrders.length === 1;

  return (
    <div className="border-b border-gray-200">
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
                disabled={!isBulkActionsEnabled}
                className={!isBulkActionsEnabled ? "opacity-50" : ""}
              >
                <Download className="w-4 h-4 mr-2" />
                Generate Documents
                {isBulkActionsEnabled && 
                  <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                    {selectedOrders.length}
                  </span>
                }
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem 
                className="flex items-center"
                onClick={onGenerateInvoice}
              >
                <FileText className="w-4 h-4 mr-2" />
                Generate Invoice
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="flex items-center"
                onClick={onGenerateQuotation}
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Generate Quotation
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="flex items-center"
                onClick={onGenerateReceipt}
              >
                <Receipt className="w-4 h-4 mr-2" />
                Generate Receipt
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            className={`border-orange-600 text-orange-600 hover:bg-orange-50 ${
              !isReturnEnabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={!isReturnEnabled}
            onClick={onReturnProduct}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Return Product
          </Button>
        </div>

        {isBulkActionsEnabled && (
          <div className="text-sm text-gray-600">
            {selectedOrders.length} order{selectedOrders.length > 1 ? 's' : ''} selected
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesActionBar;