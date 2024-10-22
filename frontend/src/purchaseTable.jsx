import React from 'react';
import { FaTrashAlt, FaEdit, FaEllipsisV } from 'react-icons/fa';


const PurchaseTable = (props) => {
    const {purchases, handleDeleteData, handleEditData} = props;
  return (
    <div className="container mx-auto p-4 flex flex-col">
      <h2 className="text-2xl font-bold mb-4">Purchase Order</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300 rounded-lg shadow-md">
          <thead>
            <tr className="border-b">
              <th className="px-4 py-2 text-left"> </th>
              <th className="px-4 py-2 text-left">PO no</th>
              <th className="px-4 py-2 text-left">Vendor Name</th>
              <th className="px-4 py-2 text-left">Order Date</th>
              <th className="px-4 py-2 text-left">Items Ordered</th>
              <th className="px-4 py-2 text-left">Total Amount(RM)</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Delivered Date</th>
              <th className="px-4 py-2 text-left"> </th>
            </tr>
          </thead>
          <tbody>
            {purchases.inventories.map((purchase, index) => (
              <tr key={purchase.id} className="border-b hover:bg-gray-100">
                <td className="px-4 py-2"><input type="radio" name="selectedPurchase" /></td>
                <td className="px-4 py-2">{purchase.purchase_order_id}</td>
                <td className="px-4 py-2">{purchase.vendor_id}</td>
                <td className="px-4 py-2">{purchase.order_date}</td>
                <td className="px-4 py-2">{purchase.total_amount}</td>
                <td className="px-4 py-2">{purchase.status_id}</td>
                <td className="px-4 py-2">{purchase.delivered_date ?? "N/A"}</td>
                <td className="px-4 py-2 flex gap-2">
                  <FaEdit className="text-gray-500 hover:text-gray-700 cursor-pointer" onClick={() => handleEditData(index)} />
                  <FaTrashAlt className="text-red-500 hover:text-red-700 cursor-pointer" onClick={() => handleDeleteData(index)}/>
                  <FaEllipsisV className="text-gray-500 hover:text-gray-700 cursor-pointer" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PurchaseTable;
