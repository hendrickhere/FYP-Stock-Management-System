import React, { useState, useContext, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { GlobalContext } from "../globalContext";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Alert, AlertDescription } from "../ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { AlertCircle } from "lucide-react";
import Header from "../header";
import Sidebar from "../sidebar";
import instance from "../axiosConfig";

const AddWarranty = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex flex-col h-screen w-full">
      <Header />
      <div className="flex flex-row flex-grow">
        <Sidebar />
        <MainContent isMobile={isMobile} />
      </div>
    </div>
  );
};

const MainContent = ({ isMobile }) => {
  const navigate = useNavigate();
  const { username, organizationId } = useContext(GlobalContext);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const searchContainerRef = useRef(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const [productData, setProductData] = useState([
    // Sample product data - replace with API data
    { id: 1, name: "Laptop Pro", sku: "PRD001", category: "Electronics" },
    { id: 2, name: "Desktop Max", sku: "PRD002", category: "Electronics" },
    { id: 3, name: "Tablet Ultra", sku: "PRD003", category: "Electronics" },
  ]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const handleProductSearch = async (e) => {
    const searchTerm = e.target.value;
    setProductSearch(searchTerm);
    fetchProduct(searchTerm);
  };

  const fetchProduct = async (searchTerm) => {
    const products = await instance.get(
      `/user/${username}/inventories?searchTerm=${searchTerm}`
    );
    setFilteredProducts(products.data.inventories);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setShowProductDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const [warrantyTypes, setWarrantyTypes] = useState({
    1: { label: "Consumer Warranty", disabled: false },
    2: { label: "Manufacturer Warranty", disabled: false },
  });

  const [formState, setFormState] = useState({
    warranty_type: "",
    terms: "",
    warranty_number: "",
    product_id: selectedProduct?.product_id ?? 0,
    organization_id: organizationId,
    description: "",
    duration: "",
    username: username,
  });

  const [errors, setErrors] = useState({});

  const handleCancel = () => {
    setShowCancelDialog(true);
  };

  const handleConfirmCancel = () => {
    setShowCancelDialog(false);
    navigate(-1);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!selectedProduct) {
      newErrors.product = "Product selection is required";
    }
    if (!formState.warranty_type) {
      newErrors.warranty_type = "Warranty type is required";
    }
    if (!formState.warranty_number) {
      newErrors.warranty_number = "Warranty number is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setFormState((prevState) => ({
      ...prevState,
      product_id: product.product_id,
    }));
    setShowProductDropdown(false);
    if (errors.product) {
      setErrors((prev) => ({ ...prev, product: undefined }));
    }
  };

  const fetchExistingWarrantyInfo = async (product) => {
    try {
      const warrantyInfo = await instance.get(
        `/warranties/availability/${product.product_id}`
      );
      return warrantyInfo;
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const checkWarrantyAvailability = async () => {
      if (!selectedProduct?.product_id) return;

      try {
        const response = await fetchExistingWarrantyInfo(selectedProduct);
        console.log(response);
        const updatedWarrantyTypes = {
          1: {
            label: "Consumer Warranty",
            disabled: !response.data.warrantyStatus[1].available,
            message: response.data.warrantyStatus[1].message,
          },
          2: {
            label: "Manufacturer Warranty",
            disabled: !response.data.warrantyStatus[2].available,
            message: response.data.warrantyStatus[2].message,
          },
        };

        setWarrantyTypes(updatedWarrantyTypes);

        // Reset warranty type if currently selected one becomes unavailable
        if (
          formState.warranty_type &&
          !response.data.data[formState.warranty_type].available
        ) {
          setFormState((prev) => ({ ...prev, warranty_type: "" }));
        }
      } catch (err) {
        console.error("Error checking warranty availability:", err);
        setApiError("Failed to check warranty availability");
      }
    };

    checkWarrantyAvailability();
  }, [selectedProduct]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setApiError(null);
    setShowSuccess(false);

    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    try {
      const submitData = {
        ...formState,
        warranty_type: parseInt(formState.warranty_type, 10),
      };
      console.log(submitData);
      const warranty = await instance.post("/warranties/create", submitData);

      if (warranty.data) {
        setShowSuccess(true);
        setTimeout(() => {
          navigate(-1);
        }, 2000);
      }
    } catch (err) {
      console.error(err);
      setApiError(
        err.response?.data?.message ||
          "An error occurred while creating the warranty. Please try again."
      );
      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <main className="flex-1">
      <div
        className={`h-[calc(100vh-4rem)] overflow-y-auto ${
          isMobile ? "w-full" : "ml-[13rem]"
        }`}
      >
        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent className="bg-white">
            <AlertDialogHeader>
              <AlertDialogTitle>Discard Changes</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to discard your changes? This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmCancel}>
                Discard Changes
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="p-6">
          <div className="max-w-[1400px] mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-bold pl-6">Add New Warranty</h1>
            </div>

            {showSuccess && (
              <Alert className="mb-6 bg-green-50 border-green-200">
                <div className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 text-green-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <AlertDescription className="text-green-700">
                    Warranty was successfully created!
                  </AlertDescription>
                </div>
              </Alert>
            )}

            {apiError && (
              <Alert
                variant="destructive"
                className="mb-6 bg-red-50 border-red-200"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700">
                    {apiError}
                  </AlertDescription>
                </div>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-8 pb-24">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Warranty Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="relative">
                      <div className="space-y-2">
                        <div className="space-y-2">
                          <div className="space-y-2" ref={searchContainerRef}>
                            <label className="text-sm font-medium text-gray-700 required-field">
                              Product
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                className={`w-full p-2 pl-3 pr-10 border rounded-md ${
                                  errors.product
                                    ? "border-red-500"
                                    : "border-gray-300"
                                }`}
                                placeholder="Search product by name or SKU..."
                                value={productSearch}
                                onChange={handleProductSearch}
                                onFocus={() => setShowProductDropdown(true)}
                              />
                              {(selectedProduct || productSearch) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedProduct(null);
                                    setProductSearch("");
                                    setShowProductDropdown(false);
                                  }}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
                                >
                                  ×
                                </button>
                              )}
                              {errors.product && (
                                <p className="text-red-500 text-sm">
                                  {errors.product}
                                </p>
                              )}
                              {showProductDropdown && (
                                <div className="absolute w-full z-10">
                                  <div className="mt-1 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                    {filteredProducts.length > 0 ? (
                                      <ul className="py-1">
                                        {filteredProducts.map((product) => (
                                          <li
                                            key={product.id}
                                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                            onClick={() => {
                                              handleProductSelect(product);
                                              setProductSearch(
                                                product.product_name
                                              );
                                              setShowProductDropdown(false);
                                            }}
                                          >
                                            <div className="flex flex-col">
                                              <span className="font-medium">
                                                {product.product_name}
                                              </span>
                                              <span className="text-sm text-gray-500">
                                                SKU: {product.sku_number}
                                              </span>
                                            </div>
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <div className="px-4 py-2 text-gray-500">
                                        {productSearch
                                          ? "No products found"
                                          : "Type to search products"}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      {errors.product && (
                        <p className="text-red-500 text-sm">{errors.product}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 required-field">
                        Warranty Type
                      </label>
                      <select
                        name="warranty_type"
                        value={formState.warranty_type}
                        onChange={handleInputChange}
                        className={`w-full p-2 border rounded-md ${
                          errors.warranty_type
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      >
                        <option value="">Select Warranty Type</option>
                        {Object.entries(warrantyTypes).map(
                          ([value, { label, disabled, message }]) => (
                            <option
                              key={value}
                              value={value}
                              disabled={disabled}
                            >
                              {label} {disabled ? `(${message})` : ""}
                            </option>
                          )
                        )}
                      </select>
                      {errors.warranty_type && (
                        <p className="text-red-500 text-sm">
                          {errors.warranty_type}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 required-field">
                        Warranty Number
                      </label>
                      <input
                        type="text"
                        name="warranty_number"
                        value={formState.warranty_number}
                        onChange={handleInputChange}
                        className={`w-full p-2 border rounded-md ${
                          errors.warranty_number
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      {errors.warranty_number && (
                        <p className="text-red-500 text-sm">
                          {errors.warranty_number}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 required-field">
                        Start Date
                      </label>
                      <input
                        type="date"
                        name="start_date"
                        value={formState.start_date}
                        onChange={handleInputChange}
                        className={`w-full p-2 border rounded-md ${
                          errors.start_date
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      {errors.start_date && (
                        <p className="text-red-500 text-sm">
                          {errors.start_date}
                        </p>
                      )}
                    </div> */}

                    {/* <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 required-field">
                        End Date
                      </label>
                      <input
                        type="date"
                        name="end_date"
                        value={formState.end_date}
                        onChange={handleInputChange}
                        className={`w-full p-2 border rounded-md ${
                          errors.end_date ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors.end_date && (
                        <p className="text-red-500 text-sm">
                          {errors.end_date}
                        </p>
                      )}
                    </div> */}

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Duration (months)
                      </label>
                      <input
                        type="number"
                        name="duration"
                        value={formState.duration}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded-md border-gray-300"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Terms & Conditions
                    </label>
                    <textarea
                      name="terms"
                      value={formState.terms}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full p-2 border rounded-md border-gray-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formState.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full p-2 border rounded-md border-gray-300"
                    />
                  </div>
                </CardContent>
              </Card>
            </form>

            {/* Action Buttons */}
            <div
              className="fixed bottom-0 right-0 bg-white border-t p-4 z-10"
              style={{
                left: isMobile ? "0" : "13rem",
              }}
            >
              <div className="max-w-[1400px] mx-auto w-full flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:opacity-50 relative"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="opacity-0">Save</span>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    </>
                  ) : (
                    "Save"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default AddWarranty;
