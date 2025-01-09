import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../ui/card';
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Pencil, 
  Trash2,
  ArrowUpDown,
  AlertCircle,
  Box
} from 'lucide-react';
import { useToast } from "../ui/use-toast";
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

// Helper function to get image URL from different possible formats
const getImageUrl = (product) => {
  if (!product?.images) return null;

  // If the data contains base64 content directly
  if (product.images && typeof product.images === 'string' && product.images.includes('data:image')) {
    return product.images;
  }

  // If images is an object with base64 content
  if (product.images && product.images.base64) {
    return product.images.base64;
  }

  // If it's an object with images array
  if (product.images.images && Array.isArray(product.images.images)) {
    const firstImage = product.images.images[0];
    if (typeof firstImage === 'string' && firstImage.includes('data:image')) {
      return firstImage;
    }
    return firstImage;
  }

  // If it's a URL rather than base64
  if (typeof product.images === 'string' && !product.images.includes('data:image')) {
    return product.images;
  }

  // If images is directly an array
  if (Array.isArray(product.images) && product.images.length > 0) {
    return product.images[0];
  }

  return null;
};

// ProductCard Component
const ProductCard = ({ product, onAction, onClick, isFeatured, onUpdate }) => {
  const CardComponent = isFeatured ? FeaturedCard : StandardCard;
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = (event) => {
    if (event) {
      event.stopPropagation();
    }
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await onAction('delete', product.product_uuid);
      setShowDeleteDialog(false);
      toast({
        description: "Product deleted successfully",
      });
    } catch (error) {
      toast({
        description: "Failed to delete product",
        variant: "destructive",
      });
    }
  };
  
  return (
    <>
      <div 
        onClick={() => onClick(product)} 
        className="h-full w-full cursor-pointer"
      >
        <div className="h-full transition-all duration-200 hover:shadow-xl hover:-translate-y-1">
          <CardComponent 
            product={product} 
            onAction={(action, event) => {
              if (action === 'delete') {
                handleDelete(event);
              } else {
                onAction(action);
              }
            }} 
            onUpdate={onUpdate}
          />
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{product.product_name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete Product
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// Standard Card Component 
const StandardCard = ({ product, onAction }) => {
  const navigate = useNavigate();
  const getDisplayImage = (product) => {
    try {
      if (!product?.images) {
        return null;
      }

      // If images is an object with images array
      if (product.images?.images && Array.isArray(product.images.images) && product.images.images.length > 0) {
        const firstImage = product.images.images[0];
        return typeof firstImage === 'string' ? firstImage : firstImage?.base64;
      }

      // Handle direct base64 string
      if (product.images && typeof product.images === 'string' && product.images.includes('data:image')) {
        return product.images;
      }

      // Handle base64 in base64 property
      if (product.images?.base64) {
        return product.images.base64;
      }

      return null;
    } catch (error) {
      return null;
    }
  };

  const imageUrl = getDisplayImage(product);

  return (
    <Card className="h-full">
      <CardContent className="p-0 h-full">
        <div className="relative">
          <div className="h-40 w-full">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={product.product_name}
                className="w-full h-full object-cover rounded-t-lg"
                onError={(e) => {
                  e.target.onerror = null; 
                  e.target.src = "/placeholder-image.jpg";
                }}
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded-t-lg">
                <span className="text-xl font-bold text-gray-400">
                  {product.product_name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            {product.product_stock <= 10 && (
              <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">
                Low Stock
              </div>
            )}
          </div>
        </div>
        <div className="p-3">
          <h3 className="font-medium text-sm mb-1 line-clamp-1">
            {product.product_name}
          </h3>
          <div className="flex justify-between items-center mb-1">
            <span className="text-base font-bold">RM {product.price}</span>
            <span
              className={`text-xs ${
                product.product_stock <= 10 ? "text-red-600" : "text-green-600"
              }`}
            >
              {product.product_stock} in stock
            </span>
          </div>
          <div className="text-xs text-gray-500 mb-2">
            SKU: {product.sku_number}
          </div>
          <div className="flex justify-end gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/inventory/${product.product_uuid}/product-units`);
              }}
              className="p-1.5 hover:bg-gray-100 rounded"
              title="View Product Units"
            >
              <Box className="w-3.5 h-3.5 text-blue-500" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction("edit");
              }}
              className="p-1.5 hover:bg-gray-100 rounded"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction("delete", e);
              }}
              className="p-1.5 hover:bg-gray-100 rounded"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-500" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Featured Card Component 
const FeaturedCard = ({ product, onAction }) => {
  const imageUrl = getImageUrl(product);
  const navigate = useNavigate();
  return (
    <Card className="hover:shadow-xl transition-shadow duration-200">
      <CardContent className="p-0">
        <div className="relative">
          <div className="h-48 w-full">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={product.product_name}
                className="w-full h-full object-cover rounded-t-lg"
                onError={(e) => {
                  console.error(
                    "Image failed to load:",
                    typeof imageUrl === "string"
                      ? imageUrl.substring(0, 100) + "..."
                      : imageUrl
                  );
                  e.target.onerror = null; 
                  e.target.src = "/placeholder-image.jpg";
                }}
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded-t-lg">
                <span className="text-2xl font-bold text-gray-400">
                  {product.product_name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="absolute top-2 right-2 flex gap-1">
              {product.product_stock <= 10 && (
                <span className="px-1.5 py-0.5 bg-red-100 text-red-800 rounded-full text-xs">
                  Low Stock
                </span>
              )}
              <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                Featured
              </span>
            </div>
          </div>
        </div>
        <div className="p-4">
          <h3 className="text-base font-bold mb-2">{product.product_name}</h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <span className="text-xs text-gray-500">Price</span>
              <div className="text-base font-bold">RM {product.price}</div>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-500">Stock Level</span>
              <div
                className={`text-sm font-bold ${
                  product.product_stock <= 10
                    ? "text-red-600"
                    : "text-green-600"
                }`}
              >
                {product.product_stock} units
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs mb-3">
            <div>
              <span className="text-gray-500">SKU</span>
              <div className="font-medium">{product.sku_number}</div>
            </div>
            <div>
              <span className="text-gray-500">Brand</span>
              <div className="font-medium">{product.brand || "N/A"}</div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/product-units/${product.product_uuid}`);
              }}
              className="px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded inline-flex items-center gap-1"
            >
              <Box className="w-3.5 h-3.5" />
              Units
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction("edit");
              }}
              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded inline-flex items-center gap-1"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction("delete", e);
              }}
              className="px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded inline-flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Sort Options Component
const SortOptions = ({ onSortChange }) => (
  <Select onValueChange={onSortChange}>
    <SelectTrigger className="w-[200px]">
      <SelectValue placeholder="Sort by..." />
    </SelectTrigger>
    <SelectContent className="bg-white">
      <SelectGroup>
        <SelectLabel>Product Info</SelectLabel>
        <SelectItem value="name-asc">Name (A-Z)</SelectItem>
        <SelectItem value="name-desc">Name (Z-A)</SelectItem>
        <SelectItem value="sku-asc">SKU Number (A-Z)</SelectItem>
        <SelectItem value="sku-desc">SKU Number (Z-A)</SelectItem>
      </SelectGroup>
      <SelectGroup>
        <SelectLabel>Stock & Price</SelectLabel>
        <SelectItem value="price-asc">Price (Low-High)</SelectItem>
        <SelectItem value="price-desc">Price (High-Low)</SelectItem>
        <SelectItem value="stock-asc">Stock (Low-High)</SelectItem>
        <SelectItem value="stock-desc">Stock (High-Low)</SelectItem>
      </SelectGroup>
      <SelectGroup>
        <SelectLabel>Other</SelectLabel>
        <SelectItem value="brand-asc">Brand (A-Z)</SelectItem>
        <SelectItem value="brand-desc">Brand (Z-A)</SelectItem>
        <SelectItem value="date-asc">Date Added (Oldest)</SelectItem>
        <SelectItem value="date-desc">Date Added (Newest)</SelectItem>
      </SelectGroup>
    </SelectContent>
  </Select>
);

// Main Layout Component
const InventoryLayout = ({ 
  products, 
  handleDeleteData, 
  handleEditData,
  onProductSelect,
  isLoading,
  onProductUpdate
}) => {
  const [sortOption, setSortOption] = useState('name-asc');
  const inventories = products?.inventories || [];

  const handleSortChange = (value) => {
    setSortOption(value);
  };

  // Sorting function
  const getSortedProducts = () => {
    try {
      // Safely filter active products
      const activeProducts = inventories.filter(product => 
        product && product.status_id === 1
      );

      const sortFunctions = {
        'name-asc': (a, b) => a.product_name.localeCompare(b.product_name),
        'name-desc': (a, b) => b.product_name.localeCompare(a.product_name),
        'price-asc': (a, b) => parseFloat(a.price) - parseFloat(b.price),
        'price-desc': (a, b) => parseFloat(b.price) - parseFloat(a.price),
        'stock-asc': (a, b) => a.product_stock - b.product_stock,
        'stock-desc': (a, b) => b.product_stock - a.product_stock,
        'sku-asc': (a, b) => a.sku_number.localeCompare(b.sku_number),
        'sku-desc': (a, b) => b.sku_number.localeCompare(a.sku_number),
        'brand-asc': (a, b) => (a.brand || '').localeCompare(b.brand || ''),
        'brand-desc': (a, b) => (b.brand || '').localeCompare(a.brand || ''),
        'date-asc': (a, b) => new Date(a.created_at) - new Date(b.created_at),
        'date-desc': (a, b) => new Date(b.created_at) - new Date(a.created_at),
      };

    // Add error handling for sort function
    const sortFunction = sortFunctions[sortOption] || sortFunctions['name-asc'];
      
      return [...activeProducts].sort((a, b) => {
        try {
          return sortFunction(a, b);
        } catch (error) {
          console.error('Error sorting products:', error);
          return 0; // Maintain original order if sort fails
        }
      });
    } catch (error) {
      console.error('Error processing products:', error);
      return []; // Return empty array if processing fails
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const sortedProducts = getSortedProducts();

  return (
    <div className="space-y-6">
      {/* Sort Controls */}
      <div className="flex items-center gap-2 mb-6">
        <ArrowUpDown className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-500">Sort by:</span>
        <SortOptions onSortChange={handleSortChange} />
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 auto-rows-max w-full">
        {sortedProducts.map((product, index) => (
          <ProductCard
            key={product.product_uuid}
            product={product}
            isFeatured={product.is_featured}
            onClick={() => onProductSelect(product)}
            onAction={(action, param) => {
              if (action === 'edit') {
                onProductSelect(product, param);
              }
              if (action === 'delete') {
                // Pass the product UUID directly
                handleDeleteData(product.product_uuid);
              }
            }}
            onUpdate={onProductUpdate}
          />
        ))}
      </div>

      {/* Empty State */}
      {sortedProducts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-500">Please add products</p>
        </div>
      )}
    </div>
  );
};

export default InventoryLayout;