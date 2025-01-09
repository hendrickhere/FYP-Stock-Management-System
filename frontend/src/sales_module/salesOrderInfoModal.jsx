import React, { useState, useContext, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog } from "@headlessui/react";
import { X, Edit, Save, Trash, Plus, Minus } from "lucide-react";
import { GlobalContext } from "../globalContext";
import { Tab } from "@headlessui/react";
import toast, { Toaster } from "react-hot-toast";
import instance from "../axiosConfig";
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
import PriceDisplay from "./priceDisplay";
import TooltipValue from "./tooltipValue.jsx";

const SalesOrderModal = ({
  isOpen,
  onClose,
  order,
  onUpdate,
  onDelete,
  userRole,
}) => {
  const [editedOrder, setEditedOrder] = useState(order);
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [requiresShipping, setRequiresShipping] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [pendingAction, setPendingAction] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [availableProducts, setAvailableProducts] = useState([]);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [customerData, setCustomerData] = useState(null);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const { username } = useContext(GlobalContext);
  const [openSerialNumbers, setOpenSerialNumbers] = useState(null);

  const isManager = userRole === "Manager";

  useEffect(() => {
    if (order) {
      setEditedOrder(order);
      setRequiresShipping(!!order.expected_shipment_date);
    }
    if (isEditing) {
      fetchAvailableProducts();
    }
  }, [order, isEditing]);

  const fetchAvailableProducts = async () => {
    try {
      const response = await instance.get(
        `/sales/products?username=${username}`
      );
      if (response.data && response.data.products) {
        setAvailableProducts(response.data.products);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        title: "Error",
        description: "Failed to load available products",
        variant: "destructive",
      });
    }
  };

  const handleCustomerSearch = async () => {
    if (showCustomerSearch) {
      setShowCustomerSearch(false);
      return;
    }

    try {
      const response = await instance.get(
        `/stakeholders/customers?username=${username}`
      );
      setCustomerData(response.data);
      setShowCustomerSearch(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch customers",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "N/A";
    }
  };

  const formatCurrency = (amount) => {
    if (typeof amount !== "number") return "N/A";
    return amount.toLocaleString("en-MY", {
      style: "currency",
      currency: "MYR",
    });
  };

  const handleUpdateOrder = async (updatedOrder) => {
    try {
      const response = await instance.put(
        `/sales/user/${username}/salesOrder/${updatedOrder.sales_order_uuid}`,
        {
          updatedData: {
            customer_id: updatedOrder.Customer?.customer_id,
            expected_shipment_date: updatedOrder.expected_shipment_date,
            payment_terms: updatedOrder.payment_terms,
            delivery_method: updatedOrder.delivery_method,
            shipping_address: updatedOrder.shipping_address,
            products:
              updatedOrder.Products?.map((product) => ({
                product_id: product.product_id,
                sales_order_items: {
                  quantity: product.sales_order_items?.quantity || 0,
                  price: product.sales_order_items?.price || product.price || 0,
                },
              })) || [],
          },
          managerPassword: adminPassword,
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to update order");
      }

      return response.data;
    } catch (error) {
      console.error("Error updating order:", error);
      if (error.response?.status === 401) {
        throw new Error("Invalid manager password");
      }
      throw new Error(
        error.response?.data?.message || "Failed to update order"
      );
    }
  };

  const handleEdit = (field, value) => {
    setEditedOrder((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
  };

  const handleCustomerChange = (customer) => {
    setEditedOrder((prev) => ({
      ...prev,
      Customer: customer,
      customer_id: customer.customer_id,
    }));
    setHasChanges(true);
  };

  const handleProductQuantityChange = (productId, newQuantity) => {
    setEditedOrder((prev) => ({
      ...prev,
      Products: prev.Products.map((product) =>
        product.product_uuid === productId
          ? {
              ...product,
              sales_order_items: {
                ...product.sales_order_items,
                quantity: parseInt(newQuantity) || 0,
              },
            }
          : product
      ),
    }));
    setHasChanges(true);
  };

  const getDiscountTooltip = () => (
    <>
      <p className="font-medium text-center border-b pb-1 mb-2">
        Applied Discounts:
      </p>
      {order.Discounts.map((discount, index) => (
        <div key={index} className="px-2">
          <div className="flex items-center justify-between gap-4">
            <span className="py-1">{discount.discount_name}</span>
            <div className="text-right text-gray-600">
              <div>
                (
                {(
                  discount.sales_order_discounts.applied_discount_rate * 100
                ).toFixed(0)}
                %)
              </div>
              <div className="text-xs">
                RM{" "}
                {parseFloat(
                  discount.sales_order_discounts.discount_amount
                ).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );

  const getTaxTooltip = () => (
    <>
      <p className="font-medium text-center border-b pb-1 mb-2">Tax Details:</p>
      {order.Taxes.map((tax, index) => (
        <div key={index} className="px-2">
          <div className="flex items-center justify-between gap-4">
            <span className="py-1">{tax.tax_name}</span>
            <div className="text-right text-gray-600">
              <div>
                ({(tax.sales_order_taxes.applied_tax_rate * 100).toFixed(0)}%)
              </div>
              <div className="text-xs">
                RM {parseFloat(tax.sales_order_taxes.tax_amount).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );

  const handleAddProduct = (product) => {
    setEditedOrder((prev) => ({
      ...prev,
      Products: [
        ...prev.Products,
        {
          ...product,
          sales_order_items: {
            quantity: 1,
            price: product.price,
          },
        },
      ],
    }));
    setShowProductSearch(false);
    setHasChanges(true);
  };

  const handleRemoveProduct = (productId) => {
    setEditedOrder((prev) => ({
      ...prev,
      Products: prev.Products.filter((p) => p.product_uuid !== productId),
    }));
    setHasChanges(true);
  };

  const validateChanges = () => {
    const newErrors = {};

    if (!editedOrder.Customer) {
      newErrors.customer = "Customer is required";
      toast.error("Please select a customer");
    }

    if (requiresShipping) {
      if (!editedOrder.expected_shipment_date) {
        newErrors.shipmentDate = "Shipment date is required";
        toast.error("Please enter expected shipment date");
      }
      if (!editedOrder.shipping_address) {
        newErrors.shippingAddress = "Shipping address is required";
        toast.error("Please enter shipping address");
      }
    }

    if (!editedOrder.Products?.length) {
      newErrors.products = "At least one product is required";
      toast.error("Please add at least one product");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateChanges()) {
      toast.error("Please fill in all required fields correctly", {
        duration: 4000,
        position: "bottom-right",
      });
      return;
    }

    setIsSaving(true);
    try {
      if (isManager) {
        setShowPasswordDialog(true);
        setPendingAction("edit");
      } else {
        const result = await handleUpdateOrder(editedOrder);
        if (result.success) {
          toast.success("Sales order updated successfully!", {
            duration: 3000,
            position: "bottom-right",
          });
          setIsEditing(false);
          setHasChanges(false);
          onClose();
        }
      }
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error(
        error.response?.data?.message || "Failed to update sales order",
        {
          duration: 4000,
          position: "bottom-right",
        }
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (isManager) {
      setShowDeleteConfirm(true);
    } else {
      toast.error("Only managers can delete sales orders", {
        duration: 4000,
        position: "bottom-right",
      });
    }
  };

  const handlePasswordVerification = async () => {
    setIsVerifying(true);
    try {
      if (pendingAction === "edit") {
        const result = await handleUpdateOrder(editedOrder);
        if (result.success) {
          setIsEditing(false);
          setShowPasswordDialog(false);
          setAdminPassword("");
          setPendingAction(null);
          setHasChanges(false);
          toast.success("Sales order updated successfully", {
            duration: 3000,
            position: "bottom-right",
          });
          onClose();
          window.location.reload();
        }
      } else if (pendingAction === "delete") {
        await onDelete(order.sales_order_uuid, adminPassword);
        setShowPasswordDialog(false);
        setAdminPassword("");
        setPendingAction(null);
        onClose();
      }
    } catch (error) {
      console.error("Error:", error);
      // Show more descriptive error message
      toast.error(
        "The password doesn't match any manager's password in the system. Please try again.",
        {
          duration: 4000,
          position: "bottom-right",
        }
      );
      // Clear password but keep dialog open
      setAdminPassword("");
    } finally {
      setIsVerifying(false);
    }
  };

  const filteredProducts = availableProducts.filter(
    (product) =>
      product.product_name
        .toLowerCase()
        .includes(productSearchTerm.toLowerCase()) ||
      product.sku_number.toString().includes(productSearchTerm)
  );

  return (
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
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30 }}
            className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl"
          >
            {/* Header */}
            <div className="border-b p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">
                Order #{order?.sales_order_uuid.slice(0, 8)}
              </h2>
              <div className="flex gap-2">
                {!isEditing && isManager && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(100vh-80px)]">
              <Tab.Group>
                <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1 mb-6">
                  {["Order Details", "Products", "Payment Info"].map((tab) => (
                    <Tab
                      key={tab}
                      className={({ selected }) =>
                        `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                        ${
                          selected
                            ? "bg-white text-blue-700 shadow"
                            : "text-gray-700 hover:bg-white/[0.12] hover:text-blue-600"
                        }`
                      }
                    >
                      {tab}
                    </Tab>
                  ))}
                </Tab.List>

                <Tab.Panels>
                  {/* Order Details Panel */}
                  <Tab.Panel>
                    <div className="space-y-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold mb-4">
                          Customer Information
                        </h3>
                        {isEditing ? (
                          <div className="relative">
                            <input
                              type="text"
                              readOnly
                              className="w-full p-2 border rounded-md"
                              placeholder="Select Customer"
                              value={editedOrder?.Customer?.customer_name || ""}
                              onClick={handleCustomerSearch}
                            />
                            {showCustomerSearch && (
                              <div className="absolute w-full z-10">
                                <div className="mt-1 w-full bg-white border rounded-lg shadow-lg">
                                  <ul className="py-1 max-h-60 overflow-auto">
                                    {customerData?.customers.map((customer) => (
                                      <li
                                        key={customer.customer_uuid}
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                        onClick={() => {
                                          handleCustomerChange(customer);
                                          setShowCustomerSearch(false);
                                        }}
                                      >
                                        {customer.customer_name}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-500">Name</p>
                              <p className="font-medium">
                                {editedOrder?.Customer?.customer_name || "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Contact</p>
                              <p className="font-medium">
                                {editedOrder?.Customer?.customer_contact ||
                                  "N/A"}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="space-y-6">
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h2 className="text-lg font-medium mb-4">
                              Order Summary
                            </h2>
                            <div className="space-y-4">
                              <div className="flex flex-col">
                                <p className="text-gray-500 text-sm">
                                  Subtotal
                                </p>
                                <p className="text-right">
                                  RM {parseFloat(order.subtotal).toFixed(2)}
                                </p>
                              </div>

                              <TooltipValue
                                label="Discount"
                                value={`RM ${parseFloat(
                                  order.discount_amount
                                ).toFixed(2)}`}
                                tooltipContent={getDiscountTooltip()}
                              />

                              <TooltipValue
                                label="Tax"
                                value={`RM ${parseFloat(
                                  order.total_tax
                                ).toFixed(2)}`}
                                tooltipContent={getTaxTooltip()}
                              />

                              <div className="pt-4 border-t">
                                <div className="flex flex-col">
                                  <p className="text-gray-500 text-sm">Total</p>
                                  <p className="text-right">
                                    RM{" "}
                                    {parseFloat(order.grand_total).toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {isEditing && (
                        <div className="mb-4">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={requiresShipping}
                              onChange={(e) =>
                                setRequiresShipping(e.target.checked)
                              }
                              className="rounded border-gray-300"
                            />
                            <span>This order requires shipping</span>
                          </label>
                        </div>
                      )}

                      {(requiresShipping ||
                        (!isEditing && order?.expected_shipment_date)) && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h3 className="text-lg font-semibold mb-4">
                            Shipping Information
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                            {isEditing ? (
                              <>
                                <div>
                                  <label className="block text-sm text-gray-500">
                                    Expected Shipment
                                  </label>
                                  <input
                                    type="date"
                                    value={
                                      editedOrder.expected_shipment_date?.split(
                                        "T"
                                      )[0] || ""
                                    }
                                    onChange={(e) =>
                                      handleEdit(
                                        "expected_shipment_date",
                                        e.target.value
                                      )
                                    }
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm text-gray-500">
                                    Delivery Method
                                  </label>
                                  <input
                                    type="text"
                                    value={editedOrder.delivery_method || ""}
                                    onChange={(e) =>
                                      handleEdit(
                                        "delivery_method",
                                        e.target.value
                                      )
                                    }
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                  />
                                </div>
                                <div className="col-span-2">
                                  <label className="block text-sm text-gray-500">
                                    Shipping Address
                                  </label>
                                  <textarea
                                    value={editedOrder.shipping_address || ""}
                                    onChange={(e) =>
                                      handleEdit(
                                        "shipping_address",
                                        e.target.value
                                      )
                                    }
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                    rows={3}
                                  />
                                </div>
                              </>
                            ) : (
                              <>
                                <div>
                                  <p className="text-sm text-gray-500">
                                    Expected Shipment
                                  </p>
                                  <p className="font-medium">
                                    {formatDate(
                                      editedOrder?.expected_shipment_date
                                    )}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">
                                    Delivery Method
                                  </p>
                                  <p className="font-medium">
                                    {editedOrder?.delivery_method || "N/A"}
                                  </p>
                                </div>
                                <div className="col-span-2">
                                  <p className="text-sm text-gray-500">
                                    Shipping Address
                                  </p>
                                  <p className="font-medium">
                                    {editedOrder?.shipping_address || "N/A"}
                                  </p>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </Tab.Panel>

                  {/* Products Panel */}
                  <Tab.Panel>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">
                          Order Products
                        </h3>
                        {/* {isEditing && (
                          <button
                            onClick={() => setShowProductSearch(true)}
                            className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
                          >
                            Add Product
                          </button>
                        )} */}
                      </div>

                      <div className="space-y-4">
                        {/* Product search section remains the same */}

                        <table className="min-w-full divide-y divide-gray-200">
                          <thead>
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Product
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                Quantity
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                Price
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                Total
                              </th>
                              {/* {isEditing && (
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                  Actions
                                </th>
                              )} */}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {editedOrder?.Products?.map((product) => (
                              <React.Fragment key={product.product_uuid}>
                                <tr className="group">
                                  <td className="px-6 py-4">
                                    <div>
                                      <p className="font-medium">
                                        {product.product_name}
                                      </p>
                                      <p className="text-sm text-gray-500">
                                        SKU: {product.sku_number}
                                      </p>
                                      {editedOrder.items?.find(
                                        (item) =>
                                          item.product_id === product.product_id
                                      )?.productUnits?.length > 0 && (
                                        <button
                                          onClick={() =>
                                            setOpenSerialNumbers((prev) =>
                                              prev === product.product_id
                                                ? null
                                                : product.product_id
                                            )
                                          }
                                          className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                                        >
                                          {openSerialNumbers ===
                                          product.product_id
                                            ? "Hide"
                                            : "Show"}{" "}
                                          Serial Numbers (
                                          {
                                            editedOrder.items.find(
                                              (item) =>
                                                item.product_id ===
                                                product.product_id
                                            )?.productUnits?.length
                                          }
                                          )
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    {/* {isEditing ? (
                                      <div className="flex items-center justify-end space-x-2">
                                        <button
                                          onClick={() =>
                                            handleProductQuantityChange(
                                              product.product_uuid,
                                              (product.items?.quantity || 0) - 1
                                            )
                                          }
                                          disabled={
                                            (product.items?.quantity || 0) <= 1
                                          }
                                          className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
                                        >
                                          <Minus className="w-4 h-4" />
                                        </button>
                                        <input
                                          type="number"
                                          min="1"
                                          value={product.items?.quantity || 0}
                                          onChange={(e) =>
                                            handleProductQuantityChange(
                                              product.product_uuid,
                                              e.target.value
                                            )
                                          }
                                          className="w-16 text-right px-2 py-1 border rounded"
                                        />
                                        <button
                                          onClick={() =>
                                            handleProductQuantityChange(
                                              product.product_uuid,
                                              (product.items?.quantity || 0) + 1
                                            )
                                          }
                                          className="p-1 hover:bg-gray-100 rounded"
                                        >
                                          <Plus className="w-4 h-4" />
                                        </button>
                                      </div>
                                    ) : ( */}
                                      {product.items?.quantity || 0}
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <PriceDisplay
                                      price={product.items?.price || 0}
                                      discountedPrice={
                                        product.items?.discounted_price
                                      }
                                      discounts={editedOrder?.Discounts || []}
                                      formatCurrency={formatCurrency}
                                    />
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    {formatCurrency(
                                      (product.items?.quantity || 0) *
                                        (product.items?.discounted_price ||
                                          product.items?.price ||
                                          0)
                                    )}
                                  </td>
                                  {/* {isEditing && (
                                    <td className="px-6 py-4 text-right">
                                      <button
                                        onClick={() =>
                                          handleRemoveProduct(
                                            product.product_uuid
                                          )
                                        }
                                        className="text-red-500 hover:text-red-700"
                                      >
                                        <Trash className="w-4 h-4" />
                                      </button>
                                    </td>
                                  )} */}
                                </tr>
                                {/* Serial Numbers Expandable Row */}
                                {openSerialNumbers === product.product_id && (
                                  <tr className="bg-gray-50">
                                    <td
                                      colSpan={isEditing ? 5 : 4}
                                      className="px-6 py-2"
                                    >
                                      <div className="grid grid-cols-3 gap-4">
                                        {editedOrder.items
                                          .find(
                                            (item) =>
                                              item.product_id ===
                                              product.product_id
                                          )
                                          ?.productUnits?.map((unit, index) => (
                                            <div
                                              key={unit.product_unit_id}
                                              className="text-sm bg-white p-2 rounded border flex justify-between items-center"
                                            >
                                              <span className="text-gray-600">
                                                Unit #{index + 1}
                                              </span>
                                              <span className="font-medium">
                                                {unit.serial_number}
                                              </span>
                                            </div>
                                          ))}
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </Tab.Panel>

                  {/* Payment Info Panel */}
                  <Tab.Panel>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold mb-4">
                        Payment Details
                      </h3>
                      <div className="space-y-4">
                        {isEditing ? (
                          <>
                            <div>
                              <label className="block text-sm text-gray-500">
                                Payment Terms
                              </label>
                              <input
                                type="text"
                                value={editedOrder?.payment_terms || ""}
                                onChange={(e) =>
                                  handleEdit("payment_terms", e.target.value)
                                }
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <p className="text-sm text-gray-500">
                                Payment Terms
                              </p>
                              <p className="font-medium">
                                {editedOrder?.payment_terms || "N/A"}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </Tab.Panel>
                </Tab.Panels>
              </Tab.Group>

              {/* Footer Actions */}
              {isEditing && (
                <div className="mt-6 flex justify-end gap-3 border-t pt-4">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditedOrder(order);
                      setHasChanges(false);
                    }}
                    className="px-4 py-2 text-gray-600 font-medium rounded-md hover:bg-gray-100"
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 disabled:opacity-50"
                    disabled={isSaving || !hasChanges}
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Password Dialog */}
          <AlertDialog
            open={showPasswordDialog}
            onOpenChange={setShowPasswordDialog}
          >
            <AlertDialogContent className="bg-white">
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Manager Verification Required
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Please enter your manager password to continue.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Enter manager password"
                autoComplete="new-password"
                name={`manager-pwd-${Math.random()}`}
              />
              <AlertDialogFooter>
                <AlertDialogCancel
                  onClick={() => {
                    setShowPasswordDialog(false);
                    setAdminPassword("");
                    setPendingAction(null);
                  }}
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handlePasswordVerification}
                  disabled={!adminPassword || isVerifying}
                >
                  {isVerifying ? "Verifying..." : "Verify"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Delete Confirmation Dialog */}
          <AlertDialog
            open={showDeleteConfirm}
            onOpenChange={setShowDeleteConfirm}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this sales order? This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setPendingAction("delete");
                    setShowPasswordDialog(true);
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default SalesOrderModal;
