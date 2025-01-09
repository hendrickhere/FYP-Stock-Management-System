import React, { useState } from 'react';

const PriceDisplay = ({ price, discountedPrice, discounts, formatCurrency }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <td className="px-4 md:px-6 py-4 text-right whitespace-nowrap">
     <div className="relative inline-block min-w-[100px]">
        <div 
          className="flex flex-col space-y-1 cursor-help"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          {(discountedPrice && <span className="text-gray-500 line-through">
            {formatCurrency(price)}
          </span> )}
          <span className="font-medium">
            {formatCurrency(parseFloat(discountedPrice ?? price))}
          </span>
          
          {showTooltip && discounts?.length > 0 && (
            <div className="absolute z-[999] bg-white border rounded-lg shadow-lg -translate-x-1/2 left-1/2 mt-2" style={{ minWidth: '180px' }}>
              <div className="p-2">
                <p className="font-medium text-center border-b pb-1 mb-2">Applied Discounts:</p>
                {discounts.map((discount, index) => (
                  <div key={index} className="px-2">
                    <div className="flex items-center justify-between gap-4">
                      <span>{discount.discount_name}</span>
                      <span className="text-gray-600">
                        ({(discount.discount_rate * 100).toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </td>
  );
};

export default PriceDisplay;