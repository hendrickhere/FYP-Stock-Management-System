import React, { useState } from 'react';
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
  newProducts, 
  onProductsAdded,
  onCancel 
}) => {
  const [products, setProducts] = useState(
    newProducts.map(product => ({
      ...product,
      errors: {},
      isDirty: false,
      unit: 'piece',
      dimensions: '0x0x0',
      dimensions_unit: 'cm',
      weight: 0,
      weight_unit: 'kg',
      is_expiry_goods: false,
      status_id: 1,
      brand: product.manufacturer || ''
    }))
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState(null);

  const validateProduct = (product) => {
    const errors = {};
    
    if (!product.product_name?.trim()) {
      errors.product_name = 'Product name is required';
    }
    
    if (!product.sku_number?.trim()) {
      errors.sku_number = 'SKU is required';
    } else if (!/^(BAT|PO)-[A-Z0-9]+$/.test(product.sku_number)) {
      errors.sku_number = 'Invalid SKU format (must be BAT-XXX or PO-XXX)';
    }
    
    if (!product.manufacturer?.trim()) {
      errors.manufacturer = 'Manufacturer is required';
    }
    
    if (isNaN(product.price) || product.price <= 0) {
      errors.price = 'Valid price is required';
    }
    
    if (isNaN(product.cost) || product.cost <= 0) {
      errors.cost = 'Valid cost is required';
    }
    
    if (isNaN(product.product_stock) || product.product_stock < 0) {
      errors.product_stock = 'Valid stock quantity is required';
    }

    return errors;
  };

  const handleInputChange = (index, field, value) => {
    setProducts(prevProducts => {
      const updatedProducts = [...prevProducts];
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

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setGlobalError(null);

      // Validate all products
      const productsWithValidation = products.map(product => ({
        ...product,
        errors: validateProduct(product)
      }));

      // Check if any products have errors
      const hasErrors = productsWithValidation.some(
        product => Object.keys(product.errors).length > 0
      );

      if (hasErrors) {
        setProducts(productsWithValidation);
        setGlobalError('Please fix the validation errors before submitting');
        return;
      }

      // Format products for API
      const formattedProducts = productsWithValidation.map(product => ({
        product_name: product.product_name,
        product_stock: parseInt(product.product_stock),
        sku_number: product.sku_number,
        unit: product.unit,
        brand: product.brand,
        dimensions: product.dimensions,
        dimensions_unit: product.dimensions_unit,
        manufacturer: product.manufacturer,
        weight: parseFloat(product.weight),
        weight_unit: product.weight_unit,
        is_expiry_goods: product.is_expiry_goods,
        status_id: product.status_id,
        price: parseFloat(product.price),
        cost: parseFloat(product.cost),
        description: product.description || ''
      }));

      await onProductsAdded(formattedProducts);
    } catch (error) {
      setGlobalError(error.message);
      console.error('Error adding products:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {globalError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{globalError}</AlertDescription>
        </Alert>
      )}

      {products.map((product, index) => (
        <Card key={index} className="relative">
          <CardHeader>
            <CardTitle>New Product #{index + 1}</CardTitle>
            <CardDescription>
              Enter the details for {product.productName}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                  value={product.sku_number || product.suggestedSku}
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
                  value={product.product_stock || product.quantity}
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
                  <SelectContent>
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
                  value={product.cost || product.unitPrice * 0.7} // Default 30% margin
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
          onClick={onCancel}
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