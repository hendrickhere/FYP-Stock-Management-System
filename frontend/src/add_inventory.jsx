import React, { useState, useContext, useEffect } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import { GlobalContext } from "./globalContext";
import instance from "./axiosConfig";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { AlertCircle } from "lucide-react";
import DragDropImageUploader from "./dragDropImageUploader";
import Header from "./header";
import Sidebar from "./sidebar";

const AddInventory = () => {
  const location = useLocation();
  const { inventoryuuid, isAdd } = location.state;
  const { username } = useContext(GlobalContext);
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!isAdd) {
          const response = await instance.get(`http://localhost:3002/api/user/${username}/${inventoryuuid}`);
          setData(response.data.status);
        }
      } catch (error) {
        setApiError("Failed to fetch inventory data. Please try again.");
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [username, inventoryuuid, isAdd]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (apiError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{apiError}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden">
      <Header />
      <div className="flex flex-row flex-grow overflow-hidden">
        <Sidebar />
        <MainContent data={isAdd ? {} : data} isAdd={isAdd} />
      </div>
    </div>
  );
};

const MainContent = ({ data, isAdd }) => {
  const navigate = useNavigate();
  const { username } = useContext(GlobalContext);
  const [formState, setFormState] = useState({
    inventoryName: isAdd ? "" : data.product_name || "",
    skuNumber: isAdd ? "" : data.sku_number || "",
    unit: isAdd ? "none" : data.unit || "none",
    images: [],
    dimensions: {
      height: "",
      width: "",
      length: "",
      unit: "cm"
    },
    manufacturer: "",
    brand: "",
    weight: {
      value: "",
      unit: "kg"
    },
    expiry: {
      isExpiryGoods: false,
      date: null
    },
    price: "",
    description: "",
    quantity: ""
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  const extractBase64Strings = async (images) => {
    try {
      const base64Promises = images.map((image) => {
        if (typeof image === "string") {
          return image;
        } else if (image && image.base64) {
          return Promise.resolve(image.base64);
        } else if (image && image[0] && typeof image[0] === "string") {
          return image[0];
        }
        return null;
      });

      const base64Strings = await Promise.all(base64Promises);
      return base64Strings.filter(Boolean); // Remove any null values
    } catch (error) {
      console.error("Error extracting base64 strings:", error);
      throw new Error("Failed to process images");
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formState.inventoryName.trim()) {
      newErrors.inventoryName = "Product name is required";
    }
    
    if (!formState.skuNumber.trim()) {
      newErrors.skuNumber = "SKU number is required";
    }
    
    if (formState.unit === "none") {
      newErrors.unit = "Please select a unit";
    }
    
    if (!formState.quantity || formState.quantity < 0) {
      newErrors.quantity = "Please enter a valid quantity";
    }
    
    if (!formState.price || formState.price < 0) {
      newErrors.price = "Please enter a valid price";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormState(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleImageChange = (newImages) => {
    setFormState(prev => ({
      ...prev,
      images: newImages
    }));
  };

  const handleDimensionsChange = (dimension, value) => {
    setFormState(prev => ({
      ...prev,
      dimensions: {
        ...prev.dimensions,
        [dimension]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setApiError(null);

    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    try {
      const formData = {
        productName: formState.inventoryName,
        productStock: formState.quantity,
        skuNumber: formState.skuNumber,
        unit: formState.unit,
        brand: formState.brand,
        dimensions: `${formState.dimensions.height} x ${formState.dimensions.width} x ${formState.dimensions.length}`,
        dimensionsUnit: formState.dimensions.unit,
        manufacturer: formState.manufacturer,
        weight: formState.weight.value,
        weightUnit: formState.weight.unit,
        isExpiryGoods: formState.expiry.isExpiryGoods,
        expiryDate: formState.expiry.date,
        price: formState.price,
        description: formState.description,
        images: {
          images: await extractBase64Strings(formState.images)
        }
      };

      await instance.post(
        `http://localhost:3002/api/user/${username}/addInventory`,
        formData
      );

      navigate(-1);
    } catch (error) {
      setApiError("Failed to save inventory. Please try again.");
      console.error("Error saving inventory:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    const shouldExit = window.confirm("Are you sure you want to discard changes?");
    if (shouldExit) {
      navigate(-1);
    }
  };

  return (
    <div className="flex-auto ml-52 overflow-y-auto pb-20 p-4 custom-scrollbar">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold pl-6">{isAdd ? "Add New Inventory" : "Edit Inventory"}</h1>
        </div>

        {apiError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* General Information Card */}
            <Card>
              <CardHeader>
                <CardTitle>General Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Product Name</label>
                  <input
                    type="text"
                    name="inventoryName"
                    value={formState.inventoryName}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded-md ${
                      errors.inventoryName ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.inventoryName && (
                    <p className="text-red-500 text-sm">{errors.inventoryName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">SKU Number</label>
                  <input
                    type="text"
                    name="skuNumber"
                    value={formState.skuNumber}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded-md ${
                      errors.skuNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.skuNumber && (
                    <p className="text-red-500 text-sm">{errors.skuNumber}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Unit</label>
                  <select
                    name="unit"
                    value={formState.unit}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded-md ${
                      errors.unit ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="none">Select Unit</option>
                    <option value="cm">cm</option>
                    <option value="box">box</option>
                    <option value="dz">dz</option>
                    <option value="ft">ft</option>
                    <option value="g">g</option>
                    <option value="in">in</option>
                    <option value="kg">kg</option>
                    <option value="km">km</option>
                    <option value="ml">ml</option>
                    <option value="mg">mg</option>
                    <option value="pcs">pcs</option>
                    <option value="lb">lb</option>
                    <option value="m">m</option>
                  </select>
                  {errors.unit && (
                    <p className="text-red-500 text-sm">{errors.unit}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Media Card */}
            <Card>
              <CardHeader>
                <CardTitle>Media</CardTitle>
              </CardHeader>
              <CardContent>
                <DragDropImageUploader
                  images={formState.images}
                  setImages={handleImageChange}
                  isAdd={isAdd}
                />
                <p className="text-sm text-gray-500 mt-2">
                  A maximum of 5 images can be uploaded, each not exceeding 10mb
                </p>
              </CardContent>
            </Card>

            {/* Product Information Card */}
            <Card>
              <CardHeader>
                <CardTitle>Product Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Dimensions (H × W × L)</label>
                  <div className="grid grid-cols-4 gap-2">
                    <input
                      type="number"
                      placeholder="H"
                      value={formState.dimensions.height}
                      onChange={(e) => handleDimensionsChange('height', e.target.value)}
                      className="p-2 border rounded-md"
                    />
                    <input
                      type="number"
                      placeholder="W"
                      value={formState.dimensions.width}
                      onChange={(e) => handleDimensionsChange('width', e.target.value)}
                      className="p-2 border rounded-md"
                    />
                    <input
                      type="number"
                      placeholder="L"
                      value={formState.dimensions.length}
                      onChange={(e) => handleDimensionsChange('length', e.target.value)}
                      className="p-2 border rounded-md"
                    />
                    <select
                      value={formState.dimensions.unit}
                      onChange={(e) => handleDimensionsChange('unit', e.target.value)}
                      className="p-2 border rounded-md"
                    >
                      <option value="cm">cm</option>
                      <option value="in">in</option>
                      <option value="m">m</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Weight</label>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="col-span-3">
                      <input
                        type="number"
                        name="weight"
                        value={formState.weight.value}
                        onChange={(e) => setFormState(prev => ({
                          ...prev,
                          weight: { ...prev.weight, value: e.target.value }
                        }))}
                        className="w-full p-2 border rounded-md"
                        placeholder="Enter weight"
                      />
                    </div>
                    <select
                      value={formState.weight.unit}
                      onChange={(e) => setFormState(prev => ({
                        ...prev,
                        weight: { ...prev.weight, unit: e.target.value }
                      }))}
                      className="p-2 border rounded-md"
                    >
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="lb">lb</option>
                      <option value="oz">oz</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Manufacturer</label>
                  <input
                    type="text"
                    name="manufacturer"
                    value={formState.manufacturer}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Brand</label>
                  <input
                    type="text"
                    name="brand"
                    value={formState.brand}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formState.expiry.isExpiryGoods}
                      onChange={(e) => setFormState(prev => ({
                        ...prev,
                        expiry: { ...prev.expiry, isExpiryGoods: e.target.checked }
                      }))}
                      className="rounded"
                    />
                    <label className="text-sm font-medium text-gray-700">Is Expiry Goods?</label>
                  </div>
                  {formState.expiry.isExpiryGoods && (
                    <input
                      type="date"
                      value={formState.expiry.date || ''}
                      onChange={(e) => setFormState(prev => ({
                        ...prev,
                        expiry: { ...prev.expiry, date: e.target.value }
                      }))}
                      className="w-full p-2 border rounded-md mt-2"
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Selling Information Card */}
            <Card>
              <CardHeader>
                <CardTitle>Selling Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Price (MYR)</label>
                  <input
                    type="number"
                    name="price"
                    value={formState.price}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded-md ${
                      errors.price ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.price && (
                    <p className="text-red-500 text-sm">{errors.price}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Stock Quantity</label>
                  <input
                    type="number"
                    name="quantity"
                    value={formState.quantity}
                    onChange={handleInputChange}
                    className={`w-full p-2 border rounded-md ${
                      errors.quantity ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.quantity && (
                    <p className="text-red-500 text-sm">{errors.quantity}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    value={formState.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full p-2 border rounded-md"
                    placeholder="Enter product description"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="fixed bottom-0 left-52 right-0 bg-white border-t p-4 flex justify-end space-x-4">
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
                type="submit"
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
                ) : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddInventory;