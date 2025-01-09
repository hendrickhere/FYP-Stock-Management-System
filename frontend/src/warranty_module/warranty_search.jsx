import React, { useState, useCallback, useMemo } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import debounce from 'lodash/debounce';
import { Input } from '../ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

const WarrantySearch = ({ onFilterChange, initialFilters = {} }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    id: true,
    product: true,
    type: true,
    duration: true,
    status: true,
    ...initialFilters
  });
  const [showFilterDialog, setShowFilterDialog] = useState(false);

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

  const activeFilterCount = useMemo(() => 
    Object.values(filters).filter(Boolean).length,
    [filters]
  );

  return (
    <div className="relative w-full max-w-2xl">
      <div className="relative flex items-center">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <Input
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search warranties..."
          className="pl-10 pr-4"
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
            <DialogContent className="bg-white sm:max-w-md">
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
                    <span className="text-sm capitalize">Search in {key}</span>
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

export default WarrantySearch;