import React, { useState, useCallback, useMemo } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import debounce from 'lodash/debounce';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

const CustomerSearch = ({ onFilterChange, initialFilters = {} }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    name: true,
    email: true,
    company: true,
    contact: true,
    address: true,
    ...initialFilters
  });
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

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
    setShowSuggestions(false);
  };

  const applySuggestion = (term) => {
    setSearchTerm(term);
    debouncedSearch(term);
    setShowSuggestions(false);
  };

  // Active filter count for badge
  const activeFilterCount = useMemo(() => 
    Object.values(filters).filter(Boolean).length,
    [filters]
  );

  return (
    <div className="relative w-full max-w-2xl">
      {/* Search Bar */}
      <div className="relative flex items-center">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full pl-10 pr-20 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
          placeholder="Search customers..."
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

export default CustomerSearch;