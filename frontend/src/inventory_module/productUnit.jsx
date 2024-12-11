import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { GlobalContext } from "../globalContext";
import axiosInstance from "../axiosConfig";
import Header from "../header";
import Sidebar from "../sidebar";
import Pagination from "../pagination_component/pagination";
import { Search } from "lucide-react";
import { useScrollDirection } from "../useScrollDirection";
import { motion } from "framer-motion";
import instance from "../axiosConfig";

const springTransition = {
  type: "spring",
  stiffness: 400,
  damping: 40,
  mass: 0.3,
  restDelta: 0.001,
};

function ProductUnits() {
  const { productUuid } = useParams();
  const { username } = useContext(GlobalContext);
  const navigate = useNavigate();
  const { scrollDirection, isAtTop } = useScrollDirection();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // State management
  const [loading, setLoading] = useState(true);
  const [productUnits, setProductUnits] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const [productDetails, setProductDetails] = useState(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchProductUnits = async () => {
    setLoading(true);
    try {
      const response = await instance.get(
        `/products/units/${username}/${productUuid}`,
        {
          params: {
            pageNumber: currentPage,
            pageSize,
            searchTerm,
          },
        }
      );

      setProductUnits(response.data.data.productUnits);
      setTotalItems(response.data.data.pagination.totalItems);
      setTotalPages(response.data.data.pagination.totalPages);
      setHasNextPage(response.data.data.pagination.hasNextPage);
      setHasPreviousPage(response.data.data.pagination.hasPreviousPage);

      // Fetch product details if not already loaded
      if (!productDetails) {
        const productResponse = await axiosInstance.get(
          `/api/user/${username}/product/${productUuid}`
        );
        setProductDetails(productResponse.data);
      }
    } catch (error) {
      console.error("Error fetching product units:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductUnits();
  }, [currentPage, pageSize, searchTerm, productUuid]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  return (
    <div className="flex flex-col h-screen w-full">
      <Header scrollDirection={scrollDirection} isAtTop={isAtTop} />
      <div className="flex flex-row flex-grow">
        <Sidebar scrollDirection={scrollDirection} isAtTop={isAtTop} />
        <motion.div
          className="flex-1 p-6"
          animate={{
            marginLeft: isMobile
              ? "0"
              : scrollDirection === "down" && !isAtTop
              ? "4rem"
              : "13rem",
          }}
          transition={springTransition}
        >
          {/* Header Section */}
          <div className="mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">Product Units</h1>
                {productDetails && (
                  <p className="text-gray-600">
                    {productDetails.product_name} - SKU:{" "}
                    {productDetails.sku_number}
                  </p>
                )}
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by serial number..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="pl-10 pr-4 py-2 border rounded-lg w-full lg:w-64"
                />
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="bg-white rounded-lg shadow">
            <div className="overflow-x-auto min-h-[500px] max-h-[calc(100vh-300px)]">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Serial Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Warranty Information
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Purchase Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sale Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                        </div>
                      </td>
                    </tr>
                  ) :productUnits.length === 0 ? (
                    <tr>
                      <td colSpan="6">
                        <div className="flex flex-col items-center justify-center py-16">
                          <div className="mb-4">
                            <svg 
                              className="w-12 h-12 text-gray-400"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.5"
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                          </div>
                          <h3 className="text-base text-gray-900 mb-1">No product units found</h3>
                          <p className="text-sm text-gray-500">Register new serial numbers to get started</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    productUnits.map((unit) => (
                      <tr
                        key={unit.product_unit_id}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {unit.serial_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {unit.source_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              unit.is_sold
                                ? "bg-red-100 text-red-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {unit.is_sold ? "Sold" : "In Stock"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {unit.WarrantyUnits?.length > 0 ? (
                            <div className="space-y-2">
                              {unit.WarrantyUnits.map((warranty, index) => (
                                <div
                                  key={index}
                                  className={`p-2 rounded-lg ${
                                    warranty.Warranty?.warranty_type === 1
                                      ? "bg-blue-50"
                                      : "bg-purple-50"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    <span
                                      className={`text-xs font-semibold px-2 py-0.5 rounded ${
                                        warranty.Warranty?.warranty_type === 1
                                          ? "bg-blue-100 text-blue-800"
                                          : "bg-purple-100 text-purple-800"
                                      }`}
                                    >
                                      {warranty.Warranty?.warranty_type === 1
                                        ? "Consumer"
                                        : "Manufacturer"}
                                    </span>
                                    <span
                                      className={`text-xs ${
                                        new Date(warranty.warranty_end) <
                                        new Date()
                                          ? "text-red-600 bg-red-100 px-2 py-0.5 rounded"
                                          : "text-gray-500"
                                      }`}
                                    >
                                      {new Date(warranty.warranty_end) <
                                      new Date()
                                        ? "Expired"
                                        : `${warranty.Warranty.duration} months`}
                                    </span>
                                  </div>
                                  <div className="text-xs space-y-1">
                                    <div className="text-gray-600">
                                      From:{" "}
                                      {new Date(
                                        warranty.warranty_start
                                      ).toLocaleDateString()}
                                    </div>
                                    <div className="text-gray-600">
                                      To:{" "}
                                      {new Date(
                                        warranty.warranty_end
                                      ).toLocaleDateString()}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">No Warranty</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {unit.date_of_purchase
                            ? new Date(
                                unit.date_of_purchase
                              ).toLocaleDateString()
                            : "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {unit.date_of_sale
                            ? new Date(unit.date_of_sale).toLocaleDateString()
                            : "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              hasNextPage={hasNextPage}
              hasPreviousPage={hasPreviousPage}
              pageSize={pageSize}
              onPageSizeChange={handlePageSizeChange}
              totalItems={totalItems}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default ProductUnits;
