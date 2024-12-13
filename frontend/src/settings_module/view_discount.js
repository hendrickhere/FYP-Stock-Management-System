import React, { useState, useEffect, useContext } from 'react';
import { Search, RefreshCw, AlertCircle } from 'lucide-react';
import { GlobalContext } from '../globalContext';
import { Alert, AlertDescription } from "../ui/alert";
import instance from '../axiosConfig';

const DiscountView = () => {
  const [discounts, setDiscounts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [includeExpired, setIncludeExpired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { organizationId } = useContext(GlobalContext);

  // Function to fetch discounts with optional refresh state
  const fetchDiscounts = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await instance.get(`/discounts`, {
        params: {
          organizationId,
          includeExpired: includeExpired ? 1 : 0
        }
      });

      setDiscounts(response.data.discounts);
      setError(null);
    } catch (err) {
      setError('Failed to load discount configurations. Please try again later.');
      console.error('Error fetching discounts:', err);
    } finally {
      setLoading(false);
      if (showRefresh) {
        setIsRefreshing(false);
      }
    }
  };

  // Initial load and when includeExpired changes
  useEffect(() => {
    fetchDiscounts();
  }, [includeExpired, organizationId]);

  // Handle manual refresh
  const handleRefresh = () => {
    fetchDiscounts(true);
  };

  // Format date consistently
  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('default', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Check if discount is expired
  const isDiscountExpired = (endDate) => {
    if (!endDate) return false;
    return new Date(endDate) < new Date();
  };

  // Filter discounts based on search term
  const filteredDiscounts = discounts.filter(discount =>
    discount.discount_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    discount.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm ">
      {/* Header Section */}
      <div className="p-4 md:p-6 border-b border-gray-200">
        <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
          <div className="w-full sm:w-auto order-2 sm:order-1">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search discounts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-64 pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#38304C] focus:border-transparent"
                />
              </div>
              <label className="flex items-center gap-2 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={includeExpired}
                  onChange={(e) => setIncludeExpired(e.target.checked)}
                  className="rounded border-gray-300 text-[#38304C] focus:ring-[#38304C]"
                />
                <span className="text-sm text-gray-600">Show Expired</span>
              </label>
            </div>
          </div>
          
          <button
            onClick={handleRefresh}
            className={`p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors order-1 sm:order-2 ${
              isRefreshing ? "animate-spin" : ""
            }`}
            disabled={isRefreshing}
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Table Section */}
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Discount Name
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
            </tr>
          </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4">
                      <div className="flex justify-center items-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                        <span>Loading discounts...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredDiscounts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      {searchTerm ? "No matching discounts found" : "No discounts available"}
                    </td>
                  </tr>
                ) : (
                  filteredDiscounts.map((discount) => (
                    <tr key={discount.discount_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {discount.discount_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {(discount.discount_rate * 100).toFixed(2)}%
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {discount.description || "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(discount.discount_start)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(discount.discount_end)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isDiscountExpired(discount.discount_end)
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {isDiscountExpired(discount.discount_end) ? "Expired" : "Active"}
                    </span>
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

export default DiscountView;