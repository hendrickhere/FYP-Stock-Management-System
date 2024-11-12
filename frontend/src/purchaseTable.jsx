import React from 'react';
import { FaTrashAlt, FaEdit, FaEllipsisV } from 'react-icons/fa';

const PurchaseTable = (props) => {
    const {purchases, handleDeleteData, handleEditData} = props;

    if (!purchases) return null;
    
    const purchaseOrders = Array.isArray(purchases.purchases) ? purchases.purchases : [];
  return (
    <div className="container mr-auto ml-0 p-4 flex flex-col">
      <h2 className="text-2xl font-bold mb-4">Purchase Order</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300 rounded-lg shadow-md">
          <thead>
            <tr className="border-b">
              <th className="px-4 py-2 text-left"> </th>
              <th className="px-4 py-2 text-left">PO no</th>
              <th className="px-4 py-2 text-left">Vendor Name</th>
              <th className="px-4 py-2 text-left">Order Date</th>
              <th className="px-4 py-2 text-left">Total Amount(RM)</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Delivered Date</th>
              <th className="px-4 py-2 text-left"> </th>
            </tr>
          </thead>
            <tbody>
                {purchaseOrders.length === 0 ? (
                    <tr>
                        <td colSpan="9" className="px-4 py-8 text-center text-gray-500 bg-gray-50">
                            <div className="flex flex-col items-center justify-center space-y-3">
                                <svg
                                    className="w-12 h-12 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                                    />
                                </svg>
                                <span className="text-lg font-medium">No purchase orders found</span>
                                <p className="text-sm text-gray-500">
                                    Create a new purchase order to get started
                                </p>
                            </div>
                        </td>
                    </tr>
                ) : (
                    purchaseOrders.map((purchase, index) => (
                        <tr key={purchase.id} className="border-b hover:bg-gray-100">
                            <td className="px-4 py-2"><input type="radio" name="selectedPurchase" /></td>
                            <td className="px-4 py-2">{purchase.purchase_order_id}</td>
                            <td className="px-4 py-2">{purchase.vendor_id}</td>
                            <td className="px-4 py-2">{purchase.order_date}</td>
                            <td className="px-4 py-2">{purchase.total_amount}</td>
                            <td className="px-4 py-2">{purchase.status_id}</td>
                            <td className="px-4 py-2">{purchase.delivered_date ?? "N/A"}</td>
                            <td className="px-4 py-2 flex gap-2">
                                <FaEdit 
                                    className="text-gray-500 hover:text-gray-700 cursor-pointer" 
                                    onClick={() => handleEditData(index)} 
                                />
                                <FaTrashAlt 
                                    className="text-red-500 hover:text-red-700 cursor-pointer" 
                                    onClick={() => handleDeleteData(index)}
                                />
                                <FaEllipsisV 
                                    className="text-gray-500 hover:text-gray-700 cursor-pointer" 
                                />
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default PurchaseTable;
