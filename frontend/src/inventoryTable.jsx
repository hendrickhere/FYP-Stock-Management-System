import React from 'react';
import { FaTrashAlt, FaEdit, FaEllipsisV } from 'react-icons/fa';

const ProductTable = ({ products, handleDeleteData, handleEditData }) => {
  if (!products || !products.inventories) return null;

  const inventories = Array.isArray(products.inventories) ? products.inventories : [];

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <svg
        className="w-12 h-12 text-gray-400 mb-3"
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
      <span className="text-lg font-medium text-gray-900">No inventory found</span>
      <p className="text-sm text-gray-500">Add a product to get started</p>
    </div>
  );

  return (
    <div className="w-full">
      {/* Mobile List View */}
      <div className="block md:hidden">
        {inventories.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4 px-4">
            {inventories.map((product, index) => (
              <div key={product.id} className="bg-white p-4 rounded-lg shadow border">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-semibold break-words flex-1 pr-4">{product.product_name}</div>
                  <div className="flex gap-2 shrink-0">
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
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  {[
                    ['SKU', product.sku_number],
                    ['Brand', product.brand],
                    ['Manufacturer', product.manufacturer],
                    ['Expiry Date', product.expiry_date ?? 'N/A'],
                    ['Price', `RM ${product.price}`],
                    ['Quantity', product.product_stock]
                  ].map(([label, value]) => (
                    <div key={label} className="grid grid-cols-2 gap-2">
                      <span className="text-gray-500">{label}:</span>
                      <span className="break-words">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop/Tablet Table View */}
      <div className="hidden md:block">
        <div className="relative">
          <div className="overflow-x-auto ring-1 ring-gray-200 sm:rounded-lg">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      'Name',
                      'SKU Number',
                      'Brand',
                      'Manufacturer',
                      'Expiry Date',
                      'Price(RM)',
                      'Quantity',
                      'Actions'
                    ].map((header) => (
                      <th
                        key={header}
                        className="px-4 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {inventories.length === 0 ? (
                    <tr>
                      <td colSpan="8">
                        <EmptyState />
                      </td>
                    </tr>
                  ) : (
                    inventories.map((product, index) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="whitespace-pre-wrap break-words max-w-[200px] px-4 py-3 text-sm text-gray-900">
                          {product.product_name}
                        </td>
                        <td className="whitespace-pre-wrap break-words max-w-[150px] px-4 py-3 text-sm text-gray-900">
                          {product.sku_number}
                        </td>
                        <td className="whitespace-pre-wrap break-words max-w-[150px] px-4 py-3 text-sm text-gray-900">
                          {product.brand}
                        </td>
                        <td className="whitespace-pre-wrap break-words max-w-[150px] px-4 py-3 text-sm text-gray-900">
                          {product.manufacturer}
                        </td>
                        <td className="whitespace-pre-wrap break-words max-w-[150px] px-4 py-3 text-sm text-gray-900">
                          {product.expiry_date ?? "N/A"}
                        </td>
                        <td className="whitespace-pre-wrap break-words max-w-[100px] px-4 py-3 text-sm text-gray-900">
                          {product.price}
                        </td>
                        <td className="whitespace-pre-wrap break-words max-w-[100px] px-4 py-3 text-sm text-gray-900">
                          {product.product_stock}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <div className="flex gap-3">
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
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductTable;