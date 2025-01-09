import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Checkbox from '@radix-ui/react-checkbox';
import { CheckIcon } from 'lucide-react';
import { cn } from "../ui/utils";

const ReturnModal = ({
  isOpen,
  onClose,
  selectedOrderDetails,
  selectedSerialNumbers,
  setSelectedSerialNumbers,
  returnReason,
  setReturnReason,
  onReturnComplete,
  selectedOrderId
}) => {
  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30 z-50" />
        <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-[800px] translate-x-[-50%] translate-y-[-50%] rounded-lg bg-white p-4 shadow-lg z-50">
          <Dialog.Title className="text-xl font-semibold mb-2">Return Products</Dialog.Title>
          <Dialog.Description className="text-sm text-gray-600 mb-4">
            Select the products and their serial numbers you want to return from order: {selectedOrderId}
          </Dialog.Description>

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
                        {item?.Product?.product_name || 'N/A'}
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
                      <td className="px-4 py-3 text-sm text-gray-700 text-right">RM {item.price?.toFixed(2)}</td>
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
              onClick={onReturnComplete}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Process Return
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default ReturnModal;
