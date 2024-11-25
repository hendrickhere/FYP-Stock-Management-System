import React, { useState, useCallback } from 'react';
import { Search, X, Filter } from 'lucide-react';
import debounce from 'lodash/debounce';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

const PurchasesSearch = ({ onFilterChange, initialFilters = {} }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    purchaseOrderId: true,
    vendorName: true,
    orderDate: true,
    deliveredDate: true,
    totalAmount: true,
    deliveryMethod: true,
    paymentTerms: true,
    status: true,
    subtotal: true,
    totalTax: true,
    grandTotal: true,
    ...initialFilters
  });
  const [showFilterDialog, setShowFilterDialog] = useState(false);

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((term) => {
      const activeFilters = Object.entries(filters)
        .filter(([_, active]) => active)
        .map(([key]) => key);
      
      onFilterChange({ term, activeFilters });
    }, 300),
    [filters, onFilterChange]
  );

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  const handleFilterChange = (filterKey) => {
    setFilters(prev => {
      const updated = { ...prev, [filterKey]: !prev[filterKey] };
      debouncedSearch(searchTerm);
      return updated;
    });
  };

  const clearSearch = () => {
    setSearchTerm('');
    debouncedSearch('');
  };

  // Count active filters for badge
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  // Friendly names for filter options based on purchase order model
  const filterNames = {
    purchaseOrderId: 'Purchase Order ID',
    vendorName: 'Vendor Name',
    orderDate: 'Order Date',
    deliveredDate: 'Delivered Date',
    totalAmount: 'Total Amount',
    deliveryMethod: 'Delivery Method',
    paymentTerms: 'Payment Terms',
    status: 'Status',
    subtotal: 'Subtotal',
    totalTax: 'Total Tax',
    grandTotal: 'Grand Total'
  };

  return (
    <div className="relative w-full max-w-2xl">
      <div className="relative flex items-center">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background pl-10 pr-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          placeholder="Search purchase orders..."
          name={`search-${Math.random()}`}
          autoComplete="off"
        />
        <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-2">
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
          <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
            <DialogTrigger asChild>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors relative">
                <Filter className="h-4 w-4 text-gray-400" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-white">
              <DialogHeader>
                <DialogTitle>Search Filters</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {Object.entries(filters).map(([key, active]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => handleFilterChange(key)}
                      className="rounded border-gray-300 text-blue-500 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="text-sm">
                      Search in {filterNames[key] || key}
                    </span>
                  </label>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default PurchasesSearch;