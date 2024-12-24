import React, { useState, useEffect, useCallback, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, Transition } from "@headlessui/react";
import { FaTimes, FaTrash } from "react-icons/fa";
import { Alert } from "../ui/alert";
import { Tab } from "@headlessui/react";
import toast, { Toaster } from "react-hot-toast";
import axiosInstance from "../axiosConfig";
import DragDropImageUploader from "../dragDropImageUploader";
import { Box, Shield, Pencil } from "lucide-react";
const { Panel, Overlay, Title } = Dialog;
const ProductDetailModal = ({
  isOpen,
  onClose,
  product,
  index,
  handleDeleteData,
  handleEditData,
  username,
  onProductUpdate,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    product_name: product?.product_name || "",
    sku_number: product?.sku_number || "",
    unit: product?.unit || "none",
    images: [],
    dimensions: {
      height: "",
      width: "",
      length: "",
      unit: product?.dimensions_unit || "cm",
    },
    manufacturer: product?.manufacturer || "",
    brand: product?.brand || "",
    weight: {
      value: product?.weight || "",
      unit: product?.weight_unit || "kg",
    },
    is_expiry_goods: product?.is_expiry_goods || false,
    expiry_date: product?.expiry_date || null,
    price: product?.price || "",
    cost: product?.cost || "",
    description: product?.description || "",
    product_stock: product?.product_stock || "",
    warranties: product?.warranties || [],
  });

  const [errors, setErrors] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isSerialModalOpen, setIsSerialModalOpen] = useState(false);
  const [scannedSerials, setScannedSerials] = useState([]);

  useEffect(() => {
    if (product) {
      console.log("Initial product data:", product);
      console.log("Initial images data:", product.images);
      // Extract images properly from the product data
      let productImages = [];
      if (product.images) {
        // If images is an object with images array (from database)
        if (product.images.images && Array.isArray(product.images.images)) {
          console.log(
            "Case 1: Object with images array:",
            product.images.images
          );
          productImages = product.images.images;
        }
        // If images is directly an array
        else if (Array.isArray(product.images)) {
          console.log("Case 2: Direct array:", product.images);
          productImages = product.images;
        }
        // If images is a string (single image URL)
        else if (typeof product.images === "string") {
          console.log("Case 3: Single string URL:", product.images);
          productImages = [product.images];
        } else if (
          typeof product.images === "object" &&
          product.images.base64
        ) {
          console.log("Case 4: Object with base64:", product.images.base64);
          productImages = [product.images.base64];
        }
      }

      console.log("Processed productImages:", productImages);

      // Parse dimensions string (e.g., "10 x 20 x 30") into individual values
      let height = "",
        width = "",
        length = "";
      if (product.dimensions) {
        const dimensions = product.dimensions.split("x").map((d) => d.trim());
        if (dimensions.length === 3) {
          [height, width, length] = dimensions;
        }
      }

      setFormData((prev) => ({
        ...prev,
        product_name: product.product_name || "",
        sku_number: product.sku_number || "",
        unit: product.unit || "none",
        images: productImages,
        dimensions: {
          height,
          width,
          length,
          unit: product.dimensions_unit || "cm",
        },
        manufacturer: product.manufacturer || "",
        brand: product.brand || "",
        weight: {
          value: product.weight || "",
          unit: product.weight_unit || "kg",
        },
        is_expiry_goods: product.is_expiry_goods || false,
        expiry_date: product.expiry_date
          ? new Date(product.expiry_date).toISOString().split("T")[0]
          : "",
        price: product.price || "",
        cost: product.cost || "",
        description: product.description || "",
        product_stock: product.product_stock || "",
        warranties: product?.warranties || [],
      }));
    }
    setIsEditing(false);
    setHasChanges(false);
    setErrors({});
  }, [product]);

  // Validation rules
  const validateField = (name, value) => {
    const newErrors = { ...errors };

    switch (name) {
      case "sku_number":
        if (!value?.trim()) {
          newErrors[name] = "SKU is required";
        } else if (!/^[A-Za-z0-9]+$/.test(value)) {
          newErrors[name] = "SKU can only contain letters and numbers";
        } else if (value.length > 20) {
          // Optional: add a max length check
          newErrors[name] = "SKU cannot be longer than 20 characters";
        } else {
          delete newErrors[name];
        }
        break;
      case "product_stock":
        if (value < 0) {
          newErrors[name] = "Stock cannot be negative";
        } else {
          delete newErrors[name];
        }
        break;
      case "price":
        if (value < 0) {
          newErrors[name] = "Price cannot be negative";
        } else {
          delete newErrors[name];
        }
        break;
      case "cost":
        if (value < 0) {
          newErrors[name] = "Cost cannot be negative";
        } else {
          delete newErrors[name];
        }
        break;
      case "weight":
        if (value > 100) {
          newErrors[name] = "Weight cannot exceed 100";
        } else if (value < 0) {
          newErrors[name] = "Weight cannot be negative";
        } else {
          delete newErrors[name];
        }
        break;
      // Add validation for dimensions
      case "dimensions.height":
      case "dimensions.width":
      case "dimensions.length":
        const dimensionValue = parseFloat(value);
        if (dimensionValue > 200) {
          newErrors[name] = "Dimension cannot exceed 200";
        } else if (dimensionValue < 0) {
          newErrors[name] = "Dimension cannot be negative";
        } else {
          delete newErrors[name];
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue;

    if (type === "checkbox") {
      newValue = checked;
    } else if (name === "sku_number") {
      // Allow alphanumeric characters, remove spaces and special characters
      newValue = value.replace(/[^A-Za-z0-9]/g, "");
    } else {
      newValue = value;
    }

    validateField(name, newValue);

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));
    setHasChanges(true);
  };

  const handleDimensionsChange = (dimension, value) => {
    validateField(`dimensions.${dimension}`, value);

    setFormData((prev) => ({
      ...prev,
      dimensions: {
        ...prev.dimensions,
        [dimension]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleWeightChange = (value) => {
    validateField("weight.value", value);
    setFormData((prev) => ({
      ...prev,
      weight: {
        ...prev.weight,
        value,
      },
    }));
    setHasChanges(true);
  };

  const handleImageChange = (newImages) => {
    setFormData((prev) => ({
      ...prev,
      images: newImages,
    }));
    setHasChanges(true);
  };

  const handleImageDelete = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    // Validate all fields
    console.log("Current cost before save:", formData.cost);
    let isValid = true;
    Object.entries(formData).forEach(([field, value]) => {
      if (!validateField(field, value)) {
        isValid = false;
      }
    });

    if (!isValid) {
      toast.error("Please correct the errors before saving");
      return;
    }

    // Format dimensions for API
    const dimensionsString = `${formData.dimensions.height}x${formData.dimensions.width}x${formData.dimensions.length}`;

    setIsSaving(true);
    try {
      const payloadSize = new Blob([JSON.stringify(formData)]).size;
      if (payloadSize > 10000000) {
        // 10MB limit
        toast.error("Total data size is too large. Please use smaller images.");
        return;
      }
      const updateData = {
        productName: formData.product_name,
        productStock: formData.product_stock,
        skuNumber: formData.sku_number,
        unit: formData.unit,
        brand: formData.brand,
        dimensions: dimensionsString,
        dimensionsUnit: formData.dimensions.unit,
        manufacturer: formData.manufacturer,
        weight: formData.weight.value,
        weightUnit: formData.weight.unit,
        isExpiryGoods: formData.is_expiry_goods,
        expiryDate: formData.is_expiry_goods ? formData.expiry_date : null,
        price: parseFloat(formData.price),
        cost: parseFloat(formData.cost),
        description: formData.description,
        images: {
          images: formData.images.map((img) => {
            // If the image is too large, you might want to compress it here
            return img;
          }),
        },
      };
      console.log("Form Data before send:", formData);
      console.log("Update Data being sent:", updateData);

      const response = await axiosInstance.put(
        `/user/${username}/${product.product_uuid}/editInventory`,
        updateData
      );

      console.log("Response data:", response.data);
      console.log("Updated product cost:", response.data.inventory.cost);

      if (response.status === 200) {
        toast.success("Product updated successfully!");
        setHasChanges(false);
        setIsEditing(false);
        if (onProductUpdate) {
          console.log("Data being passed to parent:", response.data.inventory);
          onProductUpdate(response.data.inventory);
        }
      }
    } catch (error) {
      console.error("Update error:", error);
      if (error.response?.status === 413) {
        toast.error("Image size is too large. Please use a smaller image.");
      } else {
        toast.error(
          error.response?.data?.message || "Failed to update product"
        );
      }
    }
  };

  const confirmDelete = async () => {
    try {
      await handleDeleteData(index);
      toast.success("Product deleted successfully");
      onClose();
    } catch (error) {
      toast.error("Failed to delete product");
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <Dialog
            static
            open={isOpen}
            onClose={() => {
              if (hasChanges) {
                if (
                  window.confirm(
                    "You have unsaved changes. Are you sure you want to close?"
                  )
                ) {
                  onClose();
                }
              } else {
                onClose();
              }
            }}
            className="fixed inset-0 z-50 overflow-hidden"
          >
            <Toaster position="bottom-right" />

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/30"
              onClick={() => {
                if (!hasChanges) onClose();
              }}
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30 }}
              className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl"
            >
              {/* Header */}
              <div className="flex justify-between items-center p-4 border-b">
                <input
                  type="text"
                  name="product_name"
                  value={formData.product_name}
                  onChange={handleInputChange}
                  className={`text-xl font-bold w-full ${
                    !isEditing
                      ? "bg-transparent border-none"
                      : "border rounded-md px-2"
                  }`}
                  disabled={!isEditing}
                />
                <button
                  onClick={() => {
                    if (hasChanges) {
                      if (
                        window.confirm(
                          "You have unsaved changes. Are you sure you want to close?"
                        )
                      ) {
                        onClose();
                      }
                    } else {
                      onClose();
                    }
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <FaTimes />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(100vh-8rem)] custom-scrollbar">
                {/* Product Image */}
                <div className="mb-6">
                  {isEditing ? (
                    <DragDropImageUploader
                      images={formData.images}
                      setImages={handleImageChange}
                      deleteImage={handleImageDelete}
                      isAdd={false}
                    />
                  ) : formData.images?.length > 0 ? (
                    <div className="w-full h-64 relative">
                      <img
                        src={
                          typeof formData.images[0] === "string"
                            ? formData.images[0]
                            : formData.images[0]?.base64 ||
                              formData.images[0]?.url
                        }
                        alt={formData.product_name}
                        className="w-full h-64 object-cover rounded-lg"
                        onError={(e) => {
                          console.error(
                            "Image failed to load:",
                            formData.images[0]
                          );
                          console.error(
                            "Image type:",
                            typeof formData.images[0]
                          );
                          console.error("Full image data:", formData.images[0]);
                          e.target.src = "/placeholder-image.jpg"; // Fallback image
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Box className="w-20 h-20 text-gray-400" />
                    </div>
                  )}
                </div>
                {/* Tabs */}
                <Tab.Group>
                  <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1 mb-4">
                    {[
                      "Product Details",
                      "Stock & Pricing",
                      "Additional Info",
                    ].map((category) => (
                      <Tab
                        key={category}
                        className={({ selected }) =>
                          `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                        ${
                          selected
                            ? "bg-white text-blue-700 shadow"
                            : "text-gray-700 hover:bg-white/[0.12] hover:text-blue-600"
                        }`
                        }
                      >
                        {category}
                      </Tab>
                    ))}
                  </Tab.List>

                  <Tab.Panels>
                    {/* Product Details Panel */}
                    <Tab.Panel className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          SKU Number
                        </label>
                        <input
                          type="text"
                          name="sku_number"
                          value={formData.sku_number}
                          onChange={handleInputChange}
                          className={`w-full p-2 border rounded-md ${
                            errors.sku_number
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          disabled={!isEditing}
                        />
                        {errors.sku_number && (
                          <p className="text-red-500 text-xs">
                            {errors.sku_number}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Dimensions (H × W × L)
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          <input
                            type="number"
                            placeholder="H"
                            value={formData.dimensions.height}
                            onChange={(e) =>
                              handleDimensionsChange("height", e.target.value)
                            }
                            className={`p-2 border rounded-md ${
                              errors["dimensions.height"]
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                            disabled={!isEditing}
                          />
                          <input
                            type="number"
                            placeholder="W"
                            value={formData.dimensions.width}
                            onChange={(e) =>
                              handleDimensionsChange("width", e.target.value)
                            }
                            className={`p-2 border rounded-md ${
                              errors["dimensions.width"]
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                            disabled={!isEditing}
                          />
                          <input
                            type="number"
                            placeholder="L"
                            value={formData.dimensions.length}
                            onChange={(e) =>
                              handleDimensionsChange("length", e.target.value)
                            }
                            className={`p-2 border rounded-md ${
                              errors["dimensions.length"]
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                            disabled={!isEditing}
                          />
                          <select
                            value={formData.dimensions.unit}
                            onChange={(e) =>
                              handleDimensionsChange("unit", e.target.value)
                            }
                            className="p-2 border rounded-md"
                            disabled={!isEditing}
                          >
                            <option value="cm">cm</option>
                            <option value="in">in</option>
                            <option value="m">m</option>
                          </select>
                        </div>
                        {(errors["dimensions.height"] ||
                          errors["dimensions.width"] ||
                          errors["dimensions.length"]) && (
                          <p className="text-red-500 text-xs">
                            Dimensions must be between 0 and 200
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Weight
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          <div className="col-span-3">
                            <input
                              type="number"
                              value={formData.weight.value}
                              onChange={(e) =>
                                handleWeightChange(e.target.value)
                              }
                              className={`w-full p-2 border rounded-md ${
                                errors.weight
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                              placeholder="Enter weight"
                              disabled={!isEditing}
                            />
                            {errors.weight && (
                              <p className="text-red-500 text-xs">
                                {errors.weight}
                              </p>
                            )}
                          </div>
                          <select
                            value={formData.weight.unit}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                weight: {
                                  ...prev.weight,
                                  unit: e.target.value,
                                },
                              }))
                            }
                            className="p-2 border rounded-md"
                            disabled={!isEditing}
                          >
                            <option value="kg">kg</option>
                            <option value="g">g</option>
                            <option value="lb">lb</option>
                            <option value="oz">oz</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Manufacturer
                        </label>
                        <input
                          type="text"
                          name="manufacturer"
                          value={formData.manufacturer}
                          onChange={handleInputChange}
                          className="w-full p-2 border rounded-md"
                          disabled={!isEditing}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Brand
                        </label>
                        <input
                          type="text"
                          name="brand"
                          value={formData.brand}
                          onChange={handleInputChange}
                          className="w-full p-2 border rounded-md"
                          disabled={!isEditing}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Unit
                        </label>
                        <select
                          name="unit"
                          value={formData.unit}
                          onChange={handleInputChange}
                          className={`w-full p-2 border rounded-md ${
                            errors.unit ? "border-red-500" : "border-gray-300"
                          }`}
                          disabled={!isEditing}
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
                          <p className="text-red-500 text-xs">{errors.unit}</p>
                        )}
                      </div>
                    </Tab.Panel>

                    {/* Stock & Pricing Panel */}
                    <Tab.Panel className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Purchase Cost (MYR)
                        </label>
                        <input
                          type="number"
                          name="cost"
                          value={formData.cost}
                          onChange={handleInputChange}
                          className={`w-full p-2 border rounded-md ${
                            errors.cost ? "border-red-500" : "border-gray-300"
                          }`}
                          disabled={!isEditing}
                        />
                        <p className="text-xs text-gray-500">
                          The cost price you pay to acquire this item
                        </p>
                        {errors.cost && (
                          <p className="text-red-500 text-xs">{errors.cost}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Selling Price (MYR)
                        </label>
                        <input
                          type="number"
                          name="price"
                          value={formData.price}
                          onChange={handleInputChange}
                          className={`w-full p-2 border rounded-md ${
                            errors.price ? "border-red-500" : "border-gray-300"
                          }`}
                          disabled={!isEditing}
                        />
                        <p className="text-xs text-gray-500">
                          The price you sell this item to customers
                        </p>
                        {errors.price && (
                          <p className="text-red-500 text-xs">{errors.price}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Stock Quantity
                        </label>
                        <input
                          type="number"
                          name="product_stock"
                          value={formData.product_stock}
                          onChange={handleInputChange}
                          className={`w-full p-2 border rounded-md ${
                            errors.product_stock
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          disabled={!isEditing}
                        />
                        {errors.product_stock && (
                          <p className="text-red-500 text-xs">
                            {errors.product_stock}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-medium text-gray-700">
                            Unregistered Items
                          </label>
                          <span className="text-sm text-gray-500">
                            {product?.unregistered_quantity || 0} items
                          </span>
                        </div>
                        <button
                          onClick={() => setIsSerialModalOpen(true)}
                          disabled={!product?.unregistered_quantity}
                          className="w-full px-4 py-2 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Register Serial Numbers
                        </button>
                        {product?.unregistered_quantity === 0 && (
                          <p className="text-xs text-gray-500">
                            No unregistered items to process
                          </p>
                        )}
                      </div>
                    </Tab.Panel>

                    {/* Additional Info Panel */}
                    <Tab.Panel className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Description
                        </label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          rows={4}
                          className="w-full p-2 border rounded-md"
                          placeholder="Enter product description"
                          disabled={!isEditing}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            name="is_expiry_goods"
                            checked={formData.is_expiry_goods}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            className="rounded"
                          />
                          <label className="text-sm font-medium text-gray-700">
                            Is Expiry Goods?
                          </label>
                        </div>
                        {formData.is_expiry_goods && (
                          <input
                            type="date"
                            name="expiry_date"
                            value={formData.expiry_date || ""}
                            onChange={handleInputChange}
                            className="w-full p-2 border rounded-md mt-2"
                            disabled={!isEditing}
                            min={new Date().toISOString().split("T")[0]}
                          />
                        )}
                      </div>
                      <div className="space-y-4 mt-6">
                        <div className="flex items-center gap-2">
                          <Shield className="w-5 h-5 text-blue-500" />
                          <h3 className="text-lg font-medium">
                            Warranty Information
                          </h3>
                        </div>

                        {/* Consumer Warranty */}
                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium mb-2">
                            Consumer Warranty
                          </h4>
                          <p className="text-gray-600">
                            {product?.warranties?.consumer ? (
                              <>
                                <span className="font-medium">
                                  {product.warranties.consumer.duration} months
                                </span>
                                <br />
                                {product.warranties.consumer.terms ||
                                  "No terms specified"}
                              </>
                            ) : (
                              "No consumer warranty information available"
                            )}
                          </p>
                        </div>

                        {/* Manufacturer Warranty */}
                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium mb-2">
                            Manufacturer Warranty
                          </h4>
                          <p className="text-gray-600">
                            {product?.warranties?.manufacturer ? (
                              <>
                                <span className="font-medium">
                                  {product.warranties.manufacturer.duration}{" "}
                                  months
                                </span>
                                <br />
                                {product.warranties.manufacturer.terms ||
                                  "No terms specified"}
                              </>
                            ) : (
                              "No manufacturer warranty information available"
                            )}
                          </p>
                        </div>
                      </div>
                    </Tab.Panel>
                  </Tab.Panels>
                </Tab.Group>

                {/* Delete Confirmation */}
                {isDeleting && (
                  <div className="mt-6">
                    <Alert variant="destructive">
                      <p>
                        Are you sure you want to delete this product? This
                        action cannot be undone.
                      </p>
                      <div className="mt-4 flex justify-end gap-3">
                        <button
                          onClick={() => setIsDeleting(false)}
                          className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-md hover:bg-gray-100"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={confirmDelete}
                          className="px-4 py-2 bg-red-500 text-white font-medium rounded-md hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </Alert>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="absolute bottom-0 left-0 right-0">
                {/* Desktop View */}
                <div className="hidden sm:block border-t bg-white px-6 py-4">
                  <div className="flex justify-between items-center max-w-[1400px] mx-auto">
                    <button
                      onClick={() => setIsDeleting(true)}
                      className="inline-flex items-center justify-center gap-2 h-10 px-4 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    >
                      <FaTrash className="w-4 h-4" />
                      <span className="font-medium">Delete Product</span>
                    </button>

                    <div className="flex gap-3">
                      {!isEditing ? (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="inline-flex items-center justify-center h-10 px-6 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors duration-200"
                        >
                          Edit
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setIsEditing(false);
                              setFormData(product);
                              setHasChanges(false);
                              setErrors({});
                            }}
                            className="inline-flex items-center justify-center h-10 px-6 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors duration-200"
                            disabled={isSaving}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSave}
                            disabled={isSaving || Object.keys(errors).length > 0}
                            className="inline-flex items-center justify-center h-10 px-6 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors duration-200"
                          >
                            {isSaving ? "Saving..." : "Save Changes"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mobile View - Bottom Bar */}
                <div className="sm:hidden fixed bottom-0 left-0 right-0 border-t bg-white px-4 py-3">
                  <div className="flex items-center gap-2">
                    {!isEditing ? (
                      <>
                        <button
                          onClick={() => setIsDeleting(true)}
                          className="h-10 aspect-square rounded-lg flex items-center justify-center text-red-600 hover:bg-red-50 transition-colors duration-200"
                        >
                          <FaTrash className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setIsEditing(true)}
                          className="flex-1 h-10 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors duration-200 flex items-center justify-center"
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setIsEditing(false);
                            setFormData(product);
                            setHasChanges(false);
                            setErrors({});
                          }}
                          className="flex-1 h-10 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center"
                          disabled={isSaving}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={isSaving || Object.keys(errors).length > 0}
                          className="flex-1 h-10 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors duration-200 flex items-center justify-center"
                        >
                          {isSaving ? "Saving..." : "Save"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </Dialog>
        )}

      </AnimatePresence>
      {isSerialModalOpen && (
        <Transition appear show={isSerialModalOpen} as={React.Fragment}>
          <Dialog
            as="div"
            className="relative z-[60]"
            onClose={() => setIsSerialModalOpen(false)}
          >
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black bg-opacity-25" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4">
                <Transition.Child
                  as={React.Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-4">
                      <Dialog.Title className="text-lg font-medium">
                        Register Serial Numbers
                      </Dialog.Title>
                      <button
                        onClick={() => setIsSerialModalOpen(false)}
                        className="p-2 hover:bg-gray-100 rounded-full"
                      >
                        <FaTimes />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="space-y-4">
                      {/* Status Display */}
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-sm">
                          Unregistered Items: {product?.unregistered_quantity}
                        </p>
                        <p className="text-sm">
                          Scanned Items: {scannedSerials.length}
                        </p>
                        <p className="text-sm">
                          Remaining:{" "}
                          {product?.unregistered_quantity -
                            scannedSerials.length}
                        </p>
                      </div>

                      {/* Serial Input */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Serial Number
                        </label>
                        <input
                          type="text"
                          className="w-full p-2 border rounded-md"
                          placeholder="Scan or enter serial number"
                          autoFocus
                          onKeyDown={async (e) => {
                            if (e.key === "Enter") {
                              const serial = e.target.value.trim();
                              if (
                                serial &&
                                scannedSerials.length <
                                  product.unregistered_quantity
                              ) {
                                if (!scannedSerials.includes(serial)) {
                                  setScannedSerials([
                                    ...scannedSerials,
                                    serial,
                                  ]);
                                  e.target.value = "";
                                } else {
                                  toast.error("Serial number already scanned");
                                }
                              } else if (
                                scannedSerials.length >=
                                product.unregistered_quantity
                              ) {
                                toast.error(
                                  "All unregistered items have been scanned"
                                );
                              }
                            }
                          }}
                        />
                      </div>

                      {/* Scanned List */}
                      <div className="max-h-60 overflow-y-auto">
                        {scannedSerials.map((serial, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center p-2 bg-gray-50 rounded mb-2"
                          >
                            <span className="text-sm">{serial}</span>
                            <button
                              onClick={() =>
                                setScannedSerials(
                                  scannedSerials.filter((s) => s !== serial)
                                )
                              }
                              className="text-red-500 hover:text-red-600"
                            >
                              <FaTimes />
                            </button>
                          </div>
                        ))}
                      </div>

                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      )}
    </>
  );
};

export default ProductDetailModal;
