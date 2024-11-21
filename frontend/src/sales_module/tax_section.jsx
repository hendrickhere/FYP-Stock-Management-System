import React, { useState, useEffect, useContext} from 'react';
import { X, Loader2 } from 'lucide-react';
import axiosInstance from '../axiosConfig';
import { GlobalContext } from "../globalContext";

const MultiTaxSelection = ({taxes, selectedTaxes, handleTaxChange, isLoading, error, removeTax}) => {

  const handleTaxToggle = (tax) => {
    handleTaxChange(tax);
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
        <h2 className="text-2xl font-semibold text-gray-800">Tax Selection</h2>
        <div className="text-sm text-gray-600">
          {selectedTaxes.length} tax(es) selected
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        {taxes.map(tax => (
          <div 
            key={tax.tax_id} 
            className={`p-4 rounded-lg border transition-colors ${
              selectedTaxes.find(t => t.tax_id === tax.tax_id)
                ? 'bg-blue-50 border-blue-200'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium text-gray-700">{tax.tax_name}</h3>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedTaxes.some(t => t.tax_id === tax.tax_id)}
                  onChange={() => handleTaxToggle(tax)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">{tax.description}</p>
              <p className="font-medium">{tax.tax_rate * 100}%</p>
            </div>
          </div>
        ))}
      </div>

      {selectedTaxes.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-gray-700">Selected Taxes</h3>
          <div className="space-y-2">
            {selectedTaxes.map(tax => (
              <div 
                key={tax.tax_id}
                className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
              >
                <div>
                  <p className="font-medium text-blue-900">{tax.tax_name}</p>
                  <p className="text-sm text-blue-700">{tax.tax_rate * 100}%</p>
                </div>
                <button 
                  onClick={() => removeTax(tax.tax_id)}
                  className="text-blue-600 hover:text-blue-800 p-1"
                >
                  <X size={20} />
                </button>
              </div>
            ))}
          </div>
          <div className="pt-3 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Total Tax Rate: {selectedTaxes.reduce((sum, tax) => sum + tax.tax_rate * 100, 0)}%
            </p>
          </div>
        </div>
      )}
    </div>
  );
};



export default MultiTaxSelection;