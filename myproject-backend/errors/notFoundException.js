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

class WarrantyNotFoundException extends Error {
  constructor(productId) {
      super(`No warranty found for product: ${productId}`);
      this.name = 'WarrantyNotFoundException';
      this.statusCode = 404;
  }
}

module.exports = { NotFoundException, UserNotFoundException, PurchaseOrderNotFoundException, ProductNotFoundException, WarrantyNotFoundException };