import React, { useState, useContext, useEffect } from 'react';
import { Trash, Plus, Search, X, Barcode } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import instance from '../axiosConfig';
import { GlobalContext } from '../globalContext';
const PurchaseOrderProducts = ({ 
  statusId,
  products, 
  isEditing, 
  onQuantityChange, 
  onRemoveProduct, 
  onAddProduct,
  availableProducts,
  formatCurrency, 
  currentUser, 
  purchaseOrderId
}) => {
  const [showProductModal, setShowProductModal] = useState(false);
  const [showSerialModal, setShowSerialModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const [serialNumber, setSerialNumber] = useState('');
  const [serialNumbers, setSerialNumbers] = useState({});
  const [existingSerials, setExistingSerials] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const handleSerialSubmit = (productId) => {
    if (!serialNumber) return;
    if (serialNumbers[productId]?.includes(serialNumber.trim())) {
      alert('This serial number has already been scanned');
      return;
    }
    setSerialNumbers(prev => ({
      ...prev,
      [productId]: [...(prev[productId] || []), serialNumber]
    }));
    setSerialNumber('');
  };
  const {username} = useContext(GlobalContext);

  const removeSerial = (productId, serialToRemove) => {
    setSerialNumbers(prev => ({
      ...prev,
      [productId]: prev[productId].filter(serial => serial !== serialToRemove)
    }));
  };

  const fetchSerialNumber = async (productId, purchaseOrderId) => {
    if (isFetching) return; // Prevent multiple concurrent calls
    
    try {
      setIsFetching(true);
      const response = await instance.get(`/products/productUnit?username=${username}&productId=${productId}&purchaseOrderId=${purchaseOrderId}`);
      
      if (response?.data?.data) {
        const serials = response.data.data.map(unit => unit.serial_number);
        setExistingSerials(prev => ({
          ...prev,
          [productId]: serials
        }));
      }
    } catch (error) {
      console.error('Error fetching serial numbers:', error);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (showSerialModal && selectedProduct && !existingSerials[selectedProduct.product_id]) {
      fetchSerialNumber(
        selectedProduct.product_id, 
        selectedProduct.purchase_order_item_id
      );
    }
  }, [showSerialModal, selectedProduct]);
  const handleSubmitSerials = async () => {
    setSubmitting(true);
    try {
      const formattedProducts = Object.entries(serialNumbers).map(([productId, serials]) => ({
        product_id: parseInt(productId),
        units: serials.map(serialNumber => ({
          serialNumber
        }))
      }));
  
      const requestBody = {
        products: formattedProducts,
        purchaseOrderId: purchaseOrderId, 
        username: currentUser, 
      };
  
      const response = await instance.post('/products/unit/new', requestBody);
      
      if(response)
      setSerialNumbers({}); 
      alert('Serial numbers submitted successfully');
    } catch (error) {
      alert(`Failed to submit: ${error.message}`);
    }
    setSubmitting(false);
  };

  const validateQuantities = () => {
    const invalidProducts = products.filter(product => {
      const scannedCount = serialNumbers[product.product_id]?.length || 0;
      return scannedCount > product.unregistered_quantity;
    });

    return invalidProducts.length === 0;
  };


  const ProductRow = ({ item, index }) => (
    <div
      key={index}
      className="grid grid-cols-12 gap-4 items-center text-sm py-2"
    >
      <div className="col-span-4">
        <div className="font-medium text-gray-900">
          {item.Product?.product_name || "Unknown Product"}
        </div>
        <div className="text-xs text-gray-500">
          {item.Product?.manufacturer || "N/A"}
        </div>
      </div>

      <div className="col-span-2 text-center text-gray-500">
        {item.Product?.sku_number || "N/A"}
      </div>

      <div className="col-span-2">
        <div className="flex justify-center items-center gap-2">
          <span className="text-center">{item.quantity}</span>
          {statusId === 3 && (
            <button
              onClick={() => {
                setSelectedProduct(item);
                setShowSerialModal(true);
              }}
              className="p-1 hover:bg-gray-100 rounded-full"
              title="Scan Serial Numbers"
            >
              <Barcode className="w-4 h-4 text-blue-500" />
            </button>
          )}
        </div>
      </div>

      <div className="col-span-2 text-right whitespace-nowrap overflow-hidden">
        {formatCurrency(parseFloat(item.Product?.cost) || 0)}
      </div>

      <div className="col-span-2 text-right flex items-center justify-end gap-2">
        <span className="whitespace-nowrap overflow-hidden">
          {formatCurrency(parseFloat(item.total_price) || 0)}
        </span>
        {/* {isEditing && (
          <button
            onClick={() => onRemoveProduct(item.product_id)}
            className="p-1 hover:bg-gray-100 rounded-full flex-shrink-0"
          >
            <Trash className="w-4 h-4 text-red-500" />
          </button>
        )} */}
      </div>

      {serialNumbers[item.product_id]?.length > 0 && (
        <div className="col-span-12 mt-2">
          <div className="text-xs text-gray-500 mb-1">Serial Numbers:</div>
          <div className="flex flex-wrap gap-2">
            {serialNumbers[item.product_id].map((serial, idx) => (
              <div
                key={idx}
                className="flex items-center bg-gray-100 rounded-full px-3 py-1 text-xs"
              >
                <span>{serial}</span>
                <button
                  onClick={() => removeSerial(item.product_id, serial)}
                  className="ml-2"
                >
                  <X className="w-3 h-3 text-gray-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const SerialNumberModal = () => {
    return (
      <Dialog open={showSerialModal} onOpenChange={setShowSerialModal}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>
              Scan Serial Numbers - {selectedProduct?.Product?.product_name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Scan or enter serial number"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleSerialSubmit(selectedProduct?.product_id);
                  }
                }}
                className="flex-1 px-3 py-2 border rounded-md"
                autoFocus
              />
              <button
                onClick={() => handleSerialSubmit(selectedProduct?.product_id)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add
              </button>
            </div>

            <div className="text-sm text-gray-500">
              Scanned:{" "}
              {selectedProduct?.quantity -
                selectedProduct?.unregistered_quantity +
                (serialNumbers[selectedProduct?.product_id]?.length || 0)}{" "}
              / {selectedProduct?.quantity || 0}
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {/* Existing serial numbers (read-only) */}
              {existingSerials[selectedProduct?.product_id]?.map(
                (serial, idx) => (
                  <div
                    key={`existing-${idx}`}
                    className="flex justify-between items-center py-2 border-b bg-gray-50"
                  >
                    <span>{serial}</span>
                    <span className="text-gray-500 text-sm italic">
                      Registered
                    </span>
                  </div>
                )
              )}

              {/* Newly added serial numbers (can be removed) */}
              {serialNumbers[selectedProduct?.product_id]?.map(
                (serial, idx) => (
                  <div
                    key={`new-${idx}`}
                    className="flex justify-between items-center py-2 border-b"
                  >
                    <span>{serial}</span>
                    <button
                      onClick={() =>
                        removeSerial(selectedProduct?.product_id, serial)
                      }
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-500 border-b pb-2">
        <div className="col-span-4">Product</div>
        <div className="col-span-2 text-center">SKU</div>
        <div className="col-span-2 text-center">Quantity</div>
        <div className="col-span-2 text-right">Unit Price</div>
        <div className="col-span-2 text-right">Total</div>
      </div>

      <div className="space-y-2">
        {products.map((item, index) => (
          <ProductRow key={item.product_id} item={item} index={index} />
        ))}
      </div>

      {isEditing && (
        <div>
          <button
            onClick={() => setShowProductModal(true)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mt-4"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      )}

      <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col bg-white">
          <DialogHeader>
            <DialogTitle>Select Product</DialogTitle>
          </DialogHeader>
          
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-md"
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="grid gap-3">
              {availableProducts.map((product) => (
                <button
                  key={product.product_id}
                  onClick={() => {
                    onAddProduct({
                      product_id: product.product_id,
                      Product: product,
                      quantity: 1,
                      total_price: product.cost || 0
                    });
                    setShowProductModal(false);
                  }}
                  className="w-full text-left p-4 rounded-lg border hover:border-blue-500 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{product.product_name}</div>
                      <div className="text-sm text-gray-500">
                        SKU: {product.sku_number}
                        {product.manufacturer && ` • ${product.manufacturer}`}
                      </div>
                      <div className="text-sm mt-1">
                        Stock: {product.product_stock} units
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-blue-600">
                        {formatCurrency(parseFloat(product.cost))}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <SerialNumberModal />
      {Object.keys(serialNumbers).length > 0 && (
        <div className="mt-6">
          {!validateQuantities() && (
            <div className="text-red-500 mb-2">
              Cannot register more units than available unregistered quantity
            </div>
          )}
          <div className="flex justify-end">
            <button
              onClick={handleSubmitSerials}
              disabled={submitting || !validateQuantities()}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Serial Numbers'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrderProducts;