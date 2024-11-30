import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Search, Plus } from 'lucide-react';
import { GlobalContext } from '../globalContext';
import instance from '../axiosConfig';
const DiscountView = () => {
  const [discounts, setDiscounts] = useState([]);
  const [includeExpired, setIncludeExpired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const {organizationId} = useContext(GlobalContext);

  useEffect(() => {
    fetchDiscounts();
  }, [includeExpired]);

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      const response = await instance.get(`/discounts`, {
        params: {
          organizationId,
          includeExpire: includeExpired ? 1 : 0
        }
      });
      setDiscounts(response.data.discounts);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching discounts');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString();
  };

  const isDiscountExpired = (endDate) => {
    if (!endDate) return false;
    return new Date(endDate) < new Date();
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Discount Management</h1>
        <button className="hidden inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-[#38304C] border border-transparent rounded-md shadow-sm hover:bg-[#2A2338] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#38304C]">
          <Plus size={20} />
          Add Discount
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search discounts..."
              className="pl-10 pr-4 py-2 border rounded-md w-64"
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={includeExpired}
              onChange={(e) => setIncludeExpired(e.target.checked)}
              className="rounded"
            />
            Show Expired Discounts
          </label>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="text-center p-4">Loading discounts...</div>
      ) : (
        /* Table */
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Index
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rate (%)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  End Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {discounts.map((discount, index) => (
                <tr key={discount.discount_id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {discount.discount_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {discount.discount_rate * 100}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {discount.description || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatDate(discount.discount_start)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatDate(discount.discount_end)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded-full text-sm font-medium ${
                        isDiscountExpired(discount.discount_end)
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {isDiscountExpired(discount.discount_end)
                        ? "Expired"
                        : "Active"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button className="text-blue-600 hover:text-blue-800">
                        Edit
                      </button>
                      <button className="text-red-600 hover:text-red-800">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DiscountView;