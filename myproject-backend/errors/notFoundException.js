class NotFoundException extends Error {
  constructor(message, type, statusCode) {
    super(message);
    this.name = "NotFoundException";
    this.type = type;
    this.statusCode = statusCode;
  }
}

class UserNotFoundException extends NotFoundException {
  constructor(username) {
    super(`User ${username} not found`,'user', 404);
    this.name = "UserNotFoundException";
  }
}

class PurchaseOrderNotFoundException extends NotFoundException{
  constructor(purchaseOrderId) {
    super(`Purchase Order ${purchaseOrderId} not found`, 'purchase_order', 404);
    this.name = "PurchaseOrderNotFoundException";
  }
}

class ProductNotFoundException extends NotFoundException{
  constructor(productId) {
    super(`Product ${productId} not found`, 'product', 404);
    this.name = "ProductNotFoundException";
  }
}

class ProductUnitNotFoundException extends NotFoundException {
  constructor(productUnitIds) {
    if (!Array.isArray(productUnitIds)) {
      throw new TypeError('productUnitIds must be an array');
    }
    const formattedIds = productUnitIds.join(', ');
    
    super(
      `Product units [${formattedIds}] not found`,
      'product_units',
      404
    );

    this.name = 'ProductUnitNotFoundException';
    this.productUnitIds = [...productUnitIds]; 
  }
  getProductUnitIds() {
    return [...this.productUnitIds];
  }
}

class WarrantyUnitNotFoundException extends Error{
  constructor(productUnitId){
    super(`No warranty unit found for product unit: ${productUnitId}`);
    this.name = "WarrantyUnitNotFoundException",
    this.statusCode = 404;
  }
}

class WarrantyNotFoundException extends Error {
  constructor(productId) {
      super(`No warranty found for product: ${productId}`);
      this.name = 'WarrantyNotFoundException';
      this.statusCode = 404;
  }
}

class OrganizationNotFoundException extends Error {
  constructor(organizationId) {
      super(`No organization found for organization id: ${organizationId}`);
      this.name = 'OrganizationNotFoundException';
      this.statusCode = 404;
  }
}

module.exports = { NotFoundException, UserNotFoundException, PurchaseOrderNotFoundException, ProductNotFoundException, WarrantyUnitNotFoundException, WarrantyNotFoundException, ProductUnitNotFoundException, OrganizationNotFoundException };