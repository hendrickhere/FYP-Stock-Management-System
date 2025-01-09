import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Checkbox from '@radix-ui/react-checkbox';
import * as Tooltip from '@radix-ui/react-tooltip';
import { CheckIcon } from 'lucide-react';
import { cn } from "../ui/utils";
import toast, { Toaster } from 'react-hot-toast';

const ReturnModal = ({
  isOpen,
  onClose,
  selectedOrderDetails,
  selectedSerialNumbers,
  setSelectedSerialNumbers,
  returnReason,
  setReturnReason,
  onReturnComplete,
  selectedOrderId,
  username
}) => {

  const getProductName = (productId) => {
    const product = selectedOrderDetails?.Products?.find(p => p.product_id === productId);
    return product?.product_name || 'N/A';
  };

  const handleReturn = async () => {
    try {
      // Format the selected products according to the schema
      const selectedProductsWithSerialNumbers = Object.entries(selectedSerialNumbers).map(([productId, serialNumbers]) => {
        const productUnits = serialNumbers
          .map(serialNumber => findProductUnit(productId, serialNumber))
          .filter(unit => unit !== null); // Remove any null entries

        if (productUnits.length === 0) {
          throw new Error(`No valid product units found for product ID ${productId}`);
        }

        return {
          product_id: parseInt(productId),
          product_units: productUnits
        };
      });


      // Validation checks
      if (selectedProductsWithSerialNumbers.length === 0) {
        toast.error('Please select at least one product to return');
        return;
      }

      if (!returnReason.trim()) {
        toast.error('Please provide a reason for return');
        return;
      }

      // Call the provided onReturnComplete with properly formatted data
      await onReturnComplete(
        selectedProductsWithSerialNumbers,
        new Date().toISOString(),
        selectedOrderDetails.sales_order_uuid,
        username,
        returnReason.trim()
      );

    } catch (error) {
      console.error('Error processing return:', error);
      toast.error(error.response?.data?.message || 'Failed to process return');
    }
  };

  const findProductUnit = (productId, serialNumber) => {
    // Find the matching item in the order
    const orderItem = selectedOrderDetails.items.find(
      item => item.product_id === parseInt(productId)
    );
    
    if (!orderItem) {
      console.error(`No order item found for product ID ${productId}`);
      return null;
    }

    // Find the matching product unit
    const productUnit = orderItem.productUnits.find(
      unit => unit.serial_number === serialNumber
    );

    if (!productUnit) {
      console.error(`No product unit found for serial number ${serialNumber}`);
      return null;
    }

    return {
      serial_number: productUnit.serial_number,
      product_unit_id: productUnit.product_unit_id
    };
  };
  return (
    <Tooltip.Provider>
      <Dialog.Root open={isOpen} onOpenChange={onClose}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/30 z-50" />
          <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-[800px] translate-x-[-50%] translate-y-[-50%] rounded-lg bg-white p-4 shadow-lg z-50">
            <Dialog.Title className="text-xl font-semibold mb-2">Return Products</Dialog.Title>
            <Dialog.Description className="text-sm text-gray-600 mb-4">
              Select the products and their serial numbers you want to return from order: {selectedOrderId}
            </Dialog.Description>
            <Toaster />
            <div className="space-y-4">
              <div className="max-h-[400px] overflow-y-auto rounded-lg border border-gray-200">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Product Name</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Quantity</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Serial Numbers</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Unit Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedOrderDetails?.items?.map((item) => (
                      <tr key={item.sales_order_item_id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {getProductName(item.product_id)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{item.quantity || 0}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-2">
                            {item.productUnits?.map((unit) => (
                              <div key={unit.product_unit_id} className="flex items-center gap-2">
                                <Checkbox.Root
                                  className={cn(
                                    "h-4 w-4 rounded border border-gray-300",
                                    "data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                                  )}
                                  checked={selectedSerialNumbers[item.product_id || item.Product?.product_id]?.includes(unit.serial_number)}
                                  onCheckedChange={(checked) => {
                                    setSelectedSerialNumbers(prev => {
                                      const newState = { ...prev };
                                      const productId = item.product_id || item.Product?.product_id;
                                      if (!newState[productId]) {
                                        newState[productId] = [];
                                      }
                                      if (checked) {
                                        newState[productId] = [...newState[productId], unit.serial_number];
                                      } else {
                                        newState[productId] = newState[productId]
                                          .filter(sn => sn !== unit.serial_number);
                                        if (newState[productId].length === 0) {
                                          delete newState[productId];
                                        }
                                      }
                                      return newState;
                                    });
                                  }}
                                >
                                  <Checkbox.Indicator>
                                    <CheckIcon className="h-3 w-3 text-white" />
                                  </Checkbox.Indicator>
                                </Checkbox.Root>
                                <label className="text-sm text-gray-700">
                                  {unit.serial_number}
                                </label>
                              </div>
                            ))}
                          </div>
                        </td>
                        <div className="flex flex-col items-end mr-4">
                          {item.discounted_price ? (
                            <Tooltip.Root>
                              <Tooltip.Trigger asChild>
                                <div className="flex flex-col items-end cursor-help">
                                  <span className="line-through text-gray-500">RM {item.price?.toFixed(2)}</span>
                                  <span className="text-blue-600">RM {Number(item.discounted_price).toFixed(2)}</span>
                                </div>
                              </Tooltip.Trigger>
                              <Tooltip.Portal>
                                <Tooltip.Content
                                  className="bg-gray-800 text-white text-xs rounded py-1 px-2 max-w-xs z-50"
                                  sideOffset={5}
                                >
                                  {selectedOrderDetails?.Discounts?.map((discount, index) => (
                                    <div key={index} className="whitespace-nowrap">
                                      {discount.discount_name}: {(discount.discount_rate * 100).toFixed(0)}% off
                                    </div>
                                  ))}
                                  <Tooltip.Arrow className="fill-gray-800" />
                                </Tooltip.Content>
                              </Tooltip.Portal>
                            </Tooltip.Root>
                          ) : (
                            <span>RM {item.price?.toFixed(2)}</span>
                          )}
                        </div>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Reason for Return
                </label>
                <input
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="Enter reason for return"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={handleReturn}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Process Return
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </Tooltip.Provider>

  );
};

export default ReturnModal;
