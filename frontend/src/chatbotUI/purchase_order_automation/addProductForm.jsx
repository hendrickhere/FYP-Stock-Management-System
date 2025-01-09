import React, { useState, useEffect } from 'react';
import { 
  Card,
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter 
} from "../../ui/card";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { AlertCircle, Plus, Save } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "../../ui/alert";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue 
} from "../../ui/select";

const AddProductsForm = ({ 
  products, 
  onProductsAdded,
  onCancel 
}) => {

  const [productState, setProductState] = useState(() => {
      if (!Array.isArray(products) || products.length === 0) {
          return [];
      }
      
      return products.map(product => {
          console.log('Processing product:', product);
          const sku = product.suggestedSku || product.sku || '';
          const quantity = 0;
          
          return {
              product_name: product.productName || '',
              sku_number: sku,
              manufacturer: product.manufacturer || '',
              quantity: quantity,
              cost: product.cost,
              price: product.unitPrice || product.price || 0,
              unit: product.unit || 'piece',
              brand: product.manufacturer || '',
              dimensions: '0x0x0',
              dimensions_unit: 'cm',
              weight: 0,
              weight_unit: 'kg',
              is_expiry_goods: false,
              status_id: 1,
              errors: {},
              isDirty: false
          };
      });
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState(null);

  useEffect(() => {
    console.log('AddProductsForm received products:', {
      rawProducts: products,
      productState: productState,
      mappedFields: products.map(p => ({
        suggestedSku: p.suggestedSku,
        sku: p.sku,
        cost: p.cost,
        unitPrice: p.unitPrice
      }))
    });
  }, [products, productState]);

  const validateProduct = (product) => {
    const errors = {};
    
    if (!product.product_name?.trim()) {
      errors.product_name = 'Product name is required';
    }
    
    const cost = parseFloat(product.cost);
    const price = parseFloat(product.price);
    
    if (isNaN(price) || price <= 0) {
      errors.price = 'Valid price is required';
    }
    
    if (isNaN(cost) || cost <= 0) {
      errors.cost = 'Valid cost is required';
    } else if (cost >= price) {
      errors.cost = 'Cost must be less than price';
    }
    
    return errors;
  };

  const handleInputChange = (index, field, value) => {
    setProductState(prevState => {
      const updatedProducts = [...prevState];
      updatedProducts[index] = {
        ...updatedProducts[index],
        [field]: value,
        isDirty: true,
        errors: {
          ...updatedProducts[index].errors,
          [field]: null // Clear field-specific error
        }
      };
      return updatedProducts;
    });
  };

  const handleCancel = () => {
    // Call the passed onCancel handler
    if (onCancel) {
      onCancel();
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setGlobalError(null);

      // Validate all products
      const productsWithValidation = productState.map(product => ({
        ...product,
        errors: validateProduct(product)
      }));

      // Check if any products have errors
      const hasErrors = productsWithValidation.some(
        product => Object.keys(product.errors).length > 0
      );

      if (hasErrors) {
        setProductState(productsWithValidation);  
        setGlobalError('Please fix the validation errors before submitting');
        return;
      }

      // Format products for API
      const formattedProducts = productsWithValidation.map(product => ({
        ...product,
        sku_number: product.sku_number,
        product_stock: 0,  // Enforce zero initial stock
        status_id: 1
      }));

      await onProductsAdded(formattedProducts);
    } catch (error) {
      setGlobalError(error.message);
      console.error('Error adding products:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!Array.isArray(products) || products.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          No products data provided or invalid format.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {globalError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{globalError}</AlertDescription>
        </Alert>
      )}

      {productState.map((product, index) => (
        <Card key={index} className="relative">
          <CardHeader>
            <CardTitle>New Product #{index + 1}</CardTitle>
            <CardDescription>
              Enter the details for {product.product_name}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Product Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Product Name</label>
                <Input
                  value={product.product_name || product.productName}
                  onChange={(e) => handleInputChange(index, 'product_name', e.target.value)}
                  className={product.errors?.product_name ? 'border-red-500' : ''}
                />
                {product.errors?.product_name && (
                  <p className="text-sm text-red-500">{product.errors.product_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">SKU</label>
                  <Input
                    value={product.sku_number}  
                    onChange={(e) => handleInputChange(index, 'sku_number', e.target.value)}
                    className={product.errors?.sku_number ? 'border-red-500' : ''}
                  />
                {product.errors?.sku_number && (
                  <p className="text-sm text-red-500">{product.errors.sku_number}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Manufacturer</label>
                <Input
                  value={product.manufacturer}
                  onChange={(e) => handleInputChange(index, 'manufacturer', e.target.value)}
                  className={product.errors?.manufacturer ? 'border-red-500' : ''}
                />
                {product.errors?.manufacturer && (
                  <p className="text-sm text-red-500">{product.errors.manufacturer}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Brand</label>
                <Input
                  value={product.brand}
                  onChange={(e) => handleInputChange(index, 'brand', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Initial Stock</label>
                <Input
                  type="number"
                  value={0}
                  onChange={(e) => handleInputChange(index, 'product_stock', e.target.value)}
                  className={product.errors?.product_stock ? 'border-red-500' : ''}
                  min="0"
                />
                {product.errors?.product_stock && (
                  <p className="text-sm text-red-500">{product.errors.product_stock}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Unit</label>
                <Select
                  value={product.unit}
                  onValueChange={(value) => handleInputChange(index, 'unit', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectGroup>
                      <SelectLabel>Units</SelectLabel>
                      <SelectItem value="piece">Piece</SelectItem>
                      <SelectItem value="set">Set</SelectItem>
                      <SelectItem value="box">Box</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Price (RM)</label>
                <Input
                  type="number"
                  value={product.price || product.unitPrice}
                  onChange={(e) => handleInputChange(index, 'price', e.target.value)}
                  className={product.errors?.price ? 'border-red-500' : ''}
                  min="0"
                  step="0.01"
                />
                {product.errors?.price && (
                  <p className="text-sm text-red-500">{product.errors.price}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Cost (RM)</label>
                  <Input
                    type="number"
                    value={product.cost}
                    onChange={(e) => handleInputChange(index, 'cost', e.target.value)}
                    className={product.errors?.cost ? 'border-red-500' : ''}
                    min="0"
                    step="0.01"
                  />
                {product.errors?.cost && (
                  <p className="text-sm text-red-500">{product.errors.cost}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Dimensions</label>
                <Input
                  value={product.dimensions}
                  onChange={(e) => handleInputChange(index, 'dimensions', e.target.value)}
                  placeholder="Length x Width x Height"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Dimensions Unit</label>
                <Select
                  value={product.dimensions_unit}
                  onValueChange={(value) => handleInputChange(index, 'dimensions_unit', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Units</SelectLabel>
                      <SelectItem value="cm">cm</SelectItem>
                      <SelectItem value="inch">inch</SelectItem>
                      <SelectItem value="mm">mm</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Weight</label>
                <Input
                  type="number"
                  value={product.weight}
                  onChange={(e) => handleInputChange(index, 'weight', e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Weight Unit</label>
                <Select
                  value={product.weight_unit}
                  onValueChange={(value) => handleInputChange(index, 'weight_unit', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Units</SelectLabel>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="g">g</SelectItem>
                      <SelectItem value="lb">lb</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          <Save className="w-4 h-4 mr-2" />
          {isSubmitting ? 'Adding Products...' : 'Save Products'}
        </Button>
      </div>
    </div>
  );
};

export default AddProductsForm;