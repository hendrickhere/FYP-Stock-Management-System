import React from 'react';
import { X } from 'lucide-react';

const SerialList = ({ scannedSerials, setScannedSerials, onSubmit, disabled }) => {
  const handleRemoveSerial = (serialToRemove) => {
    setScannedSerials(scannedSerials.filter(serial => serial !== serialToRemove));
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <div className="flex space-x-2 p-2 min-h-12">
          {scannedSerials.length === 0 ? (
            <div className="flex items-center justify-center w-full text-sm text-gray-500">
              No serial numbers scanned yet
            </div>
          ) : (
            scannedSerials.map((serial, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 bg-blue-100 px-3 py-1 rounded-lg"
              >
                <span className="text-sm text-blue-800">{serial}</span>
                <button
                  onClick={() => handleRemoveSerial(serial)}
                  className="text-blue-800 hover:text-blue-600"
                >
                  <X size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
      
      <button
        onClick={onSubmit}
        disabled={disabled || scannedSerials.length === 0}
        className="w-full px-4 py-2 bg-green-500 text-white font-medium rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Submit Serial Numbers
      </button>
    </div>
  );
};

export default SerialList;