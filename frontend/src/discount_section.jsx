import React, { useState, useEffect, useContext } from 'react';
import { X, Loader2, Percent } from 'lucide-react';
import { GlobalContext } from './globalContext';
import instance from './axiosConfig';
const MultiDiscountSelection = ({selectedDiscounts, discounts, handleDiscountChange, isLoading, error}) => {
  

  const handleDiscountToggle = (discount) => {
    handleDiscountChange(discount);
  };

  const calculateTotalDiscount = (discounts) => {
    return discounts.reduce((sum, discount) => sum + discount.discount_rate * 100, 0).toFixed(2);
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl p-6 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl p-6 bg-red-50 rounded-lg border border-red-200 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl p-6 bg-white rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Discount Selection</h2>
        <div className="text-sm text-gray-600">
          {selectedDiscounts.length} discount(s) selected
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        {discounts.map(discount => (
          <div 
            key={discount.discount_id} 
            className={`p-4 rounded-lg border transition-colors ${
              selectedDiscounts.find(d => d.discount_id === discount.discount_id)
                ? 'bg-green-50 border-green-200'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-medium text-gray-700">{discount.discount_name}</h3>
                {discount.is_special && (
                  <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                    Special
                  </span>
                )}
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedDiscounts.some(d => d.discount_id === discount.discount_id)}
                  onChange={() => handleDiscountToggle(discount)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">{discount.description}</p>
              <div className="flex items-center gap-2">
                <Percent size={16} className="text-gray-500" />
                <p className="font-medium">{discount.discount_rate * 100}% OFF</p>
              </div>
              {discount.discount_end && (
                <p className="text-xs text-gray-500">
                  Valid until: {new Date(discount.discount_end).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedDiscounts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-gray-700">Selected Discounts</h3>
          <div className="space-y-2">
            {selectedDiscounts.map(discount => (
              <div 
                key={discount.discount_id}
                className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-green-900">{discount.discount_name}</p>
                    {discount.is_special && (
                      <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                        Special
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-green-700">
                    <Percent size={14} />
                    <p className="text-sm">{discount.discount_rate * 100} OFF</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleDiscountToggle(discount)}
                  className="text-green-600 hover:text-green-800 p-1"
                >
                  <X size={20} />
                </button>
              </div>
            ))}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="font-medium text-gray-900">
                Total Discount: {calculateTotalDiscount(selectedDiscounts)}%
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Mock data for demonstration
const mockDiscounts = [
  {
    discount_id: 1,
    discount_name: 'Early Bird',
    description: 'Special discount for early purchases',
    discount_rate: 10,
    is_special: true,
    discount_end: '2024-12-31'
  },
  {
    discount_id: 2,
    discount_name: 'Bulk Purchase',
    description: 'Discount for bulk orders',
    discount_rate: 15,
    is_special: false
  },
  {
    discount_id: 3,
    discount_name: 'Seasonal Sale',
    description: 'Limited time seasonal discount',
    discount_rate: 20,
    is_special: true,
    discount_end: '2024-06-30'
  },
  {
    discount_id: 4,
    discount_name: 'Loyalty Reward',
    description: 'Special discount for loyal customers',
    discount_rate: 5,
    is_special: false
  }
];

export default MultiDiscountSelection;