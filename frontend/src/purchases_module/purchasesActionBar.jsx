import React from 'react';
import { BadgeDollarSign, Receipt, ClipboardList, Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";

const PurchasesActionBar = ({ 
  selectedOrders = [], 
  onCreateNew,
  onManageTax,
  onRecordExpenses,
  onCreateBill,
  onHighlightSelections,
}) => {
  const isBulkActionsEnabled = selectedOrders.length > 0;
  
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
            Create Purchase Order
          </Button>

          <Button
            variant="outline"
            onClick={onRecordExpenses}
            className="flex items-center space-x-2 px-4 py-2"
          >
            <ClipboardList className="w-4 h-4 mr-2" />
            Record Expenses
            {selectedOrders.length > 0 && 
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-gray-100">
                {selectedOrders.length}
              </span>
            }
          </Button>
        </div>

        {selectedOrders.length > 0 && (
          <div className={`text-sm ${
            (selectedOrders.length > 5 || selectedOrders.length > 1) 
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

export default PurchasesActionBar;