import React, { useState, useEffect, useContext } from "react";
import instance from "../axiosConfig";
import { GlobalContext } from "../globalContext";
import { AlertCircle, Search, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";

const TaxView = () => {
  const [taxes, setTaxes] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { organizationId } = useContext(GlobalContext);

  const fetchTaxes = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setIsRefreshing(true);
      }
      const response = await instance.get(`/taxes?orgId=${organizationId}`);
      setTaxes(response.data.data);
      setError(null);
    } catch (err) {
      setError("Failed to load tax configurations. Please try again later.");
      console.error("Error fetching taxes:", err);
    } finally {
      setLoading(false);
      if (showRefresh) {
        setIsRefreshing(false);
      }
    }
  };

  useEffect(() => {
    fetchTaxes();
  }, [organizationId]);

  const handleRefresh = () => {
    fetchTaxes(true);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredTaxes = taxes.filter(tax =>
    tax.tax_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tax.description.toLowerCase().includes(searchTerm.toLowerCase())
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
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header Section */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleRefresh}
              className={`p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors ${
                isRefreshing ? "animate-spin" : ""
              }`}
              disabled={isRefreshing}
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search taxes..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full sm:w-64 pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tax Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rate (%)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Updated
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center">
                  <div className="flex justify-center items-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                    <span>Loading taxes...</span>
                  </div>
                </td>
              </tr>
            ) : filteredTaxes.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  {searchTerm ? "No matching tax configurations found" : "No tax configurations available"}
                </td>
              </tr>
            ) : (
              filteredTaxes.map((tax) => (
                <tr 
                  key={tax.tax_id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {tax.tax_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {(tax.tax_rate * 100).toFixed(2)}%
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {tax.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {new Date(tax.updated_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        tax.tax_status === 1
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {tax.tax_status === 1 ? "Active" : "Inactive"}
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

export default TaxView;