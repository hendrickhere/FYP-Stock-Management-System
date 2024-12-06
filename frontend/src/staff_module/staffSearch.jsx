import React, { useState, useCallback, useMemo } from 'react';
import { Search, X, Filter } from 'lucide-react';
import debounce from 'lodash/debounce';
import { Input } from '../ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

const StaffSearch = ({ onFilterChange, initialFilters = {} }) => {
  // Initialize search term and filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    username: true,
    email: true,
    joinDate: true,
    organization: true,
    ...initialFilters
  });
  const [showFilterDialog, setShowFilterDialog] = useState(false);

  // Create a debounced search function that includes active filters
  const debouncedSearch = useCallback(
    debounce((term) => {
      // Get list of active filters
      const activeFilters = Object.entries(filters)
        .filter(([_, active]) => active)
        .map(([key]) => key);
      
      // Pass both search term and active filters to parent component
      onFilterChange({ term, activeFilters });
    }, 300),
    [filters, onFilterChange]
  );

  // Handle input change in search field
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  // Handle changes in filter checkboxes
  const handleFilterChange = (filterKey) => {
    setFilters(prev => {
      const updated = { ...prev, [filterKey]: !prev[filterKey] };
      // Trigger search with new filters
      debouncedSearch(searchTerm);
      return updated;
    });
  };

  // Clear search field and reset results
  const clearSearch = () => {
    setSearchTerm('');
    debouncedSearch('');
  };

  // Calculate number of active filters for the badge
  const activeFilterCount = useMemo(() => 
    Object.values(filters).filter(Boolean).length,
    [filters]
  );

  // Get human-readable filter names for display
  const getFilterDisplayName = (key) => {
    const displayNames = {
      username: 'Username',
      email: 'Email',
      joinDate: 'Join Date',
      organization: 'Organization'
    };
    return displayNames[key] || key;
  };

  return (
    <div className="relative w-full max-w-2xl">
      <div className="relative flex items-center">
        {/* Search Icon */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>

        {/* Search Input */}
        <Input
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search staff members..."
          className="pl-10 pr-4"
          autoComplete="off"
        />

        {/* Right-side buttons (Clear and Filter) */}
        <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-2">
          {/* Clear Search Button */}
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}

          {/* Filter Dialog */}
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
                {/* Filter Checkboxes */}
                {Object.entries(filters).map(([key, active]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => handleFilterChange(key)}
                      className="rounded border-gray-300 text-blue-500 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="text-sm">
                      Search in {getFilterDisplayName(key)}
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

export default StaffSearch;