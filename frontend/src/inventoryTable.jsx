import React from 'react';
import { FaTrashAlt, FaEdit, FaEllipsisV } from 'react-icons/fa';


const ProductTable = (props) => {
  const {products, handleDeleteData, handleEditData} = props;

  if (!products || !products.inventories) return null;

  const inventories = Array.isArray(products.inventories) ? products.inventories : [];

  return (
    <div className="container mr-auto ml-0 p-4 flex flex-col">
      <h2 className="text-2xl font-bold mb-4">Product List</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300 rounded-lg shadow-md">
          <thead>
            <tr className="border-b">
              <th className="px-4 py-2 text-left"> </th>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">SKU Number</th>
              <th className="px-4 py-2 text-left">Brand</th>
              <th className="px-4 py-2 text-left">Manufacturer</th>
              <th className="px-4 py-2 text-left">Expiry Date</th>
              <th className="px-4 py-2 text-left">Price(RM)</th>
              <th className="px-4 py-2 text-left">Quantity</th>
              <th className="px-4 py-2 text-left"> </th>
            </tr>
          </thead>
            <tbody>
                {inventories.length === 0 ? (
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
                                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                                    />
                                </svg>
                                <span className="text-lg font-medium">No inventory found</span>
                                <p className="text-sm text-gray-500">
                                    Add a product to get started
                                </p>
                            </div>
                        </td>
                    </tr>
                ) : (
                    inventories.map((product, index) => (
                        <tr key={product.id} className="border-b hover:bg-gray-100">
                            <td className="px-4 py-2"><input type="radio" name="selectedProduct" /></td>
                            <td className="px-4 py-2">{product.product_name}</td>
                            <td className="px-4 py-2">{product.sku_number}</td>
                            <td className="px-4 py-2">{product.brand}</td>
                            <td className="px-4 py-2">{product.manufacturer}</td>
                            <td className="px-4 py-2">{product.expiry_date ?? "N/A"}</td>
                            <td className="px-4 py-2">{product.price}</td>
                            <td className="px-4 py-2">{product.product_stock}</td>
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

export default ProductTable;
