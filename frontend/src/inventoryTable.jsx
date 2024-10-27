import React from 'react';
import { FaTrashAlt, FaEdit, FaEllipsisV } from 'react-icons/fa';


const ProductTable = (props) => {
    const {products, handleDeleteData, handleEditData} = props;
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
            {products.inventories.map((product, index) => (
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

export default ProductTable;
