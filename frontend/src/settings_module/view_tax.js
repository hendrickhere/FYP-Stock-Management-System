import React, { useState, useEffect, useContext } from "react";
import instance from "../axiosConfig";
import { GlobalContext } from "../globalContext";

const TaxView = () => {
  const [taxes, setTaxes] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const { organizationId } = useContext(GlobalContext);
  useEffect(() => {
    const fetchTaxes = async () => {
      try {
        const response = await instance.get(`/taxes?orgId=${organizationId}`);
        setTaxes(response.data.data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTaxes();
  }, []);

  if (loading) {
    return <div className="flex justify-center p-4">Loading...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mx-4">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow mx-4 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Taxes</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-4 text-left font-medium text-gray-700">
                Tax Name
              </th>
              <th className="p-4 text-left font-medium text-gray-700">
                Rate (%)
              </th>
              <th className="p-4 text-left font-medium text-gray-700">
                Description
              </th>
              <th className="p-4 text-left font-medium text-gray-700">
                Last Updated
              </th>
              <th className="p-4 text-left font-medium text-gray-700">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {taxes.map((tax) => (
              <tr key={tax.tax_id} className="border-t">
                <td className="p-4">{tax.tax_name}</td>
                <td className="p-4">{tax.tax_rate.toFixed(2) * 100}%</td>
                <td className="p-4">{tax.description}</td>
                <td className="p-4">
                  {new Date(tax.updated_at).toLocaleDateString()}
                </td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded-full text-sm ${
                      tax.tax_status === 1
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {tax.tax_status === 1 ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TaxView;
