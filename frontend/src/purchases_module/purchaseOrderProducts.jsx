import React, { useState } from 'react';
import { Trash, Plus, Search, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

const PurchaseOrderProducts = ({ 
  products, 
  isEditing, 
  onQuantityChange, 
  onRemoveProduct, 
  onAddProduct,
  availableProducts,
  formatCurrency 
}) => {
  const [showProductModal, setShowProductModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  console.log('PurchaseOrderProducts - Products:', products);
  console.log('PurchaseOrderProducts - Available Products:', availableProducts);

  // Filter available products
  const filteredProducts = availableProducts?.filter(product => 
    product.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku_number?.toString().includes(searchTerm) ||
    product.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-4">
      {/* Products Table */}
      <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-500 border-b pb-2">
        <div className="col-span-4">Product</div>
        <div className="col-span-2 text-center">SKU</div>
        <div className="col-span-2 text-center">Quantity</div>
        <div className="col-span-2 text-right">Unit Price</div>
        <div className="col-span-2 text-right">Total</div>
      </div>

      {/* Product Rows */}
      <div className="space-y-2">
        {products.map((item, index) => (
          <div key={index} className="grid grid-cols-12 gap-4 items-center text-sm py-2">
            <div className="col-span-4">
              <div className="font-medium text-gray-900">
                {item.Product?.product_name || 'Unknown Product'}
              </div>
              <div className="text-xs text-gray-500">
                {item.Product?.manufacturer || 'N/A'}
              </div>
            </div>
            
            <div className="col-span-2 text-center text-gray-500">
              {item.Product?.sku_number || 'N/A'}
            </div>
            
            <div className="col-span-2">
              <div className="flex justify-center">
                {isEditing ? (
                  <input
                    type="number"
                    min="1"
                    value={item.quantity || ''}
                    onChange={(e) => onQuantityChange(item.product_id, e.target.value)}
                    className="w-20 text-center rounded-md border-gray-300 text-sm"
                  />
                ) : (
                  <span className="text-center">{item.quantity}</span>
                )}
              </div>
            </div>
            
            <div className="col-span-2 text-right">
              {formatCurrency(item.Product?.cost || 0)}
            </div>
            
            <div className="col-span-2 text-right flex items-center justify-end gap-2">
              <span>{formatCurrency(item.total_price || 0)}</span>
              {isEditing && (
                <button
                  onClick={() => onRemoveProduct(item.product_id)}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <Trash className="w-4 h-4 text-red-500" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Product Button */}
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

      {/* Product Selection Modal */}
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
              {filteredProducts.map((product) => (
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
                        {formatCurrency(product.cost)}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchaseOrderProducts;