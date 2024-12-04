const { 
  PurchaseOrder, 
  User, 
  Product, 
  Vendor, 
  PurchaseOrderItem, 
  PurchaseOrderTax, 
  sequelize 
} = require("../models");
const { Op } = require("sequelize");
const bcrypt = require('bcryptjs');

async function getUserByUsername(username) {
  const user = await User.findOne({
    where: {
      username: username,
    },
  });
  return user.dataValues;
}

async function getVendorByVendorUuid(vendorUuid) {
  const vendor = await Vendor.findOne({
    where: {
      vendor_sn: vendorUuid
    }
  });
  return vendor.dataValues;
}

async function getGenericVendor() {
  const genericVendor = await Vendor.findOne({
    where: {
      vendor_name: 'Generic Supplier'
    },
    attributes: ['vendor_id', 'vendor_name', 'vendor_sn']
  });

  if (!genericVendor) {
    throw new Error('Generic vendor not configured. Please ensure the Generic Supplier is set up in the database.');
  }

  return genericVendor;
}

async function getInventoryByUUID(uuid) {
  const inventory = await Product.findOne({
    where: {
      status_id: 1,
      product_uuid: uuid,
    }
  });
  return inventory;
}


async function verifyManagerPassword(managerPassword) {
  try {
    const managers = await User.findAll({
      where: {
        role: 'Manager'
      }
    });

    // Check against all manager passwords
    for (const manager of managers) {
      const isValid = await bcrypt.compare(managerPassword, manager.password_hash);
      if (isValid) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Error verifying manager password:', error);
    return false;
  }
}

exports.getAllPurchases = async (username, pageNumber, pageSize) => {
  const offset = (pageNumber - 1) * pageSize;
  try {
    const user = await User.findOne({
      where: { username },
      attributes: ["user_id", "organization_id"],
    });

    if (!user) {
      throw new Error("User not found");
    }

    const { count, rows: purchases } = await PurchaseOrder.findAndCountAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ["username"],
          where: { organization_id: user.organization_id },
        },
        {
          model: PurchaseOrderItem,
          as: 'PurchaseOrderItems',
          include: [{
            model: Product,
            as: 'Product',
            attributes: [
              "product_id",
              "product_uuid",
              "product_name",
              "sku_number",
              "price",
              "cost",
              "manufacturer",
              "brand",
              "unit"
            ]
          }]
        },
        {
          model: Vendor,
          attributes: ["vendor_name", "contact_person", "phone_number"]
        }
      ],
      limit: pageSize,
      offset: offset,
      order: [['created_at', 'DESC']]
    });

    // Add logging to debug the structure
    console.log('Purchase orders with items:', 
      JSON.stringify(purchases.map(po => ({
        id: po.purchase_order_id,
        items: po.PurchaseOrderItems.map(item => ({
          productId: item.product_id,
          productInfo: item.Product
        }))
      })), null, 2)
    );

    return { purchases, totalPage: Math.ceil(count / pageSize), currentPage: pageNumber };

  } catch (err) {
    console.error("Error fetching purchase orders:", err);
    throw err;
  }
};

exports.insertPurchase = async (purchaseData) => {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('Starting purchase creation with data:', purchaseData);

    // Validate total amount
    if (!purchaseData.totalAmount || purchaseData.totalAmount <= 0) {
      throw new Error('Total amount must be greater than 0');
    }

    const user = await getUserByUsername(purchaseData.username);
    if (!user) {
      throw new Error("User not found");
    }

    const vendor = await getVendorByVendorUuid(purchaseData.vendorSn);
    if (!vendor) {
      throw new Error("Vendor not found");
    }

    // Check if delivered date is set and is today or in the past
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Reset time component for date comparison
    
    const deliveryDate = purchaseData.deliveredDate ? new Date(purchaseData.deliveredDate) : null;
    if (deliveryDate) {
      deliveryDate.setHours(0, 0, 0, 0);
    }
    
    const isDelivered = deliveryDate && deliveryDate <= currentDate;

    // Create purchase order with appropriate status
    const purchaseOrder = await PurchaseOrder.create({
      vendor_id: vendor.vendor_id,
      order_date: purchaseData.orderDate,
      delivered_date: purchaseData.deliveredDate,
      delivery_method: purchaseData.deliveryMethod || "",
      payment_terms: purchaseData.paymentTerms,
      total_amount: purchaseData.totalAmount, 
      status_id: isDelivered ? 3 : 1, // 3 for delivered, 1 for pending
      user_id: user.user_id,
      subtotal: purchaseData.totalAmount, 
      total_tax: 0, // Can be updated if tax calculation is needed
      grand_total: purchaseData.totalAmount 
    }, { transaction });

    console.log('Created purchase order:', purchaseOrder.purchase_order_id, 'Status:', isDelivered ? 'delivered' : 'pending');

    // Process each item
    for (const item of purchaseData.itemsList) {
      const itemObj = await getInventoryByUUID(item.uuid);
      if (!itemObj) {
        throw new Error(`Inventory item not found for UUID: ${item.uuid}`);
      }

      // Create purchase order item
      await PurchaseOrderItem.create({
        purchase_order_id: purchaseOrder.purchase_order_id,
        product_id: itemObj.product_id,
        quantity: item.quantity,
        total_price: itemObj.cost * item.quantity, 
      }, { transaction });

      // Update inventory quantity if order is delivered
      if (isDelivered) {
        console.log(`Updating inventory for product ${itemObj.product_id}, adding ${item.quantity} units`);
        
        await Product.update(
          {
            product_stock: sequelize.literal(`product_stock + ${item.quantity}`),
            updated_at: sequelize.fn('NOW')
          },
          {
            where: { product_id: itemObj.product_id },
            transaction
          }
        );
      }
    }

    await transaction.commit();
    console.log('Purchase order transaction completed successfully');
    return purchaseOrder;

  } catch (err) {
    console.error('Error in insertPurchase:', err);
    await transaction.rollback();
    throw err;
  }
};

exports.insertAutomatedPurchase = async (purchaseData) => {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('Starting automated purchase creation with data:', purchaseData);

    // Validate total amount
    if (!purchaseData.totalAmount || purchaseData.totalAmount <= 0) {
      throw new Error('Total amount must be greater than 0');
    }

    // Get user
    const user = await getUserByUsername(purchaseData.username);
    if (!user) {
      throw new Error("User not found");
    }

    // Get generic vendor instead of looking up by vendor_sn
    const vendor = await getGenericVendor();
    if (!vendor) {
      throw new Error("Generic vendor not configured");
    }

    // Create purchase order with generic vendor
    const purchaseOrder = await PurchaseOrder.create({
      vendor_id: vendor.vendor_id,
      order_date: purchaseData.orderDate,
      delivery_method: purchaseData.deliveryMethod || "Standard Shipping",
      payment_terms: purchaseData.paymentTerms || "Net 30",
      total_amount: purchaseData.totalAmount,
      status_id: 1, // Always start as pending for automated orders
      user_id: user.user_id,
      subtotal: purchaseData.totalAmount,
      total_tax: purchaseData.totalAmount * 0.06, // 6% tax
      grand_total: purchaseData.totalAmount * 1.06 + 500 // Including shipping
    }, { transaction });

    console.log('Created automated purchase order:', purchaseOrder.purchase_order_id);

    // Process each item, handling the BAT- prefix in SKUs
    for (const item of purchaseData.itemsList) {
      const itemSku = item.uuid.startsWith('BAT-') ? item.uuid : `BAT-${item.uuid}`;
      const itemObj = await Product.findOne({
        where: {
          sku_number: itemSku,
          status_id: 1
        }
      });

      if (!itemObj) {
        throw new Error(`Product not found for SKU: ${itemSku}`);
      }

      // Create purchase order item
      await PurchaseOrderItem.create({
        purchase_order_id: purchaseOrder.purchase_order_id,
        product_id: itemObj.product_id,
        quantity: item.quantity,
        total_price: item.price * item.quantity,
        tax: (item.price * item.quantity) * 0.06, // 6% tax per item
        discount: 0 // No discount for automated orders
      }, { transaction });
    }

    await transaction.commit();
    console.log('Automated purchase order transaction completed successfully');

    // Get complete purchase order with items for response
    const completePurchaseOrder = await PurchaseOrder.findOne({
      where: { purchase_order_id: purchaseOrder.purchase_order_id },
      include: [
        {
          model: PurchaseOrderItem,
          as: 'PurchaseOrderItems',
          include: [{
            model: Product,
            as: 'Product',
            attributes: ['product_name', 'sku_number']
          }]
        },
        {
          model: Vendor,
          attributes: ['vendor_name']
        }
      ]
    });

    return {
      success: true,
      purchaseOrder: completePurchaseOrder,
      message: "Automated purchase order created successfully"
    };

  } catch (err) {
    console.error('Error in automated purchase creation:', err);
    await transaction.rollback();
    throw err;
  }
};

exports.markPurchaseOrderAsDelivered = async (purchaseOrderId, username) => {
  const transaction = await sequelize.transaction();

  try {
    const user = await getUserByUsername(username);
    if (!user) {
      throw new Error("User not found");
    }

    // Get purchase order with items
    const purchaseOrder = await PurchaseOrder.findOne({
      where: {
        purchase_order_id: purchaseOrderId,
        order_status: 'pending'
      },
      include: [{
        model: PurchaseOrderItem,
        include: [Product]
      }],
      transaction
    });

    if (!purchaseOrder) {
      throw new Error('Purchase order not found or already processed');
    }

    // Update inventory for each item
    for (const item of purchaseOrder.PurchaseOrderItems) {
      await Product.increment({
        product_stock: item.quantity
      }, {
        where: { product_id: item.product_id },
        transaction
      });
    }

    // Update purchase order
    await purchaseOrder.update({
      order_status: 'delivered',
      delivered_date: new Date(),
    }, { transaction });

    await transaction.commit();
    return purchaseOrder;

  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

exports.cancelPurchaseOrder = async (purchaseOrderId, username) => {
  const transaction = await sequelize.transaction();

  try {
    const purchaseOrder = await PurchaseOrder.findOne({
      where: {
        purchase_order_id: purchaseOrderId,
        order_status: 'pending'
      },
      transaction
    });

    if (!purchaseOrder) {
      throw new Error('Purchase order not found or cannot be cancelled');
    }

    await purchaseOrder.update({
      order_status: 'cancelled'
    }, { transaction });

    await transaction.commit();
    return purchaseOrder;

  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// Helper function to get purchase order details with items
exports.getPurchaseOrderDetails = async (purchaseOrderId, username) => {
  const user = await getUserByUsername(username);
  if (!user) {
    throw new Error("User not found");
  }

  const purchaseOrder = await PurchaseOrder.findOne({
    where: { purchase_order_id: purchaseOrderId },
    include: [
      {
        model: PurchaseOrderItem,
        as: 'PurchaseOrderItems',  
        include: [{
          model: Product,
          // Expand the attributes to include all necessary product details
          attributes: [
            "product_id", 
            "product_name", 
            "sku_number", 
            "price", 
            "cost",
            "product_uuid",
            "unit",
            "brand",
            "manufacturer"
          ]
        }]
      },
      {
        model: Vendor,
        attributes: ['vendor_name', 'contact_person', 'phone_number', 'address']
      },
      {
        model: User,
        as: 'user',
        attributes: ['username']
      }
    ]
  });

  if (!purchaseOrder) {
    throw new Error("Purchase order not found");
  }

  return purchaseOrder;
};

exports.updatePurchaseOrderDelivery = async (purchaseOrderId, username) => {
  const transaction = await sequelize.transaction();
  
  try {
    const purchaseOrder = await PurchaseOrder.findOne({
      where: {
        purchase_order_id: purchaseOrderId,
        status_id: 1 // Only pending orders can be updated
      },
      include: [{
        model: PurchaseOrderItem,
        as: 'PurchaseOrderItems',
        include: [{
          model: Product,
          as: 'Product'
        }]
      }],
      transaction
    });

    if (!purchaseOrder) {
      throw new Error('Purchase order not found or already processed');
    }

    // Update order status
    await purchaseOrder.update({
      status_id: 3, // Delivered
      delivered_date: new Date(),
      updated_at: sequelize.fn('NOW')
    }, { transaction });

    // Update inventory for each item
    for (const item of purchaseOrder.PurchaseOrderItems) {
      await Product.update(
        {
          product_stock: sequelize.literal(`product_stock + ${item.quantity}`),
          updated_at: sequelize.fn('NOW')
        },
        {
          where: { product_id: item.product_id },
          transaction
        }
      );
    }

    await transaction.commit();
    return purchaseOrder;

  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

exports.handleUpdateOrder = async (purchaseOrderId, username, updatedData, managerPassword) => {
  const transaction = await sequelize.transaction();
  
  try {
    // Verify manager password first
    const isValidManagerPassword = await verifyManagerPassword(managerPassword);
    if (!isValidManagerPassword) {
      throw new Error("Invalid manager password");
    }

    const purchaseOrder = await PurchaseOrder.findByPk(purchaseOrderId, {
      include: [{
        model: PurchaseOrderItem,
        as: 'PurchaseOrderItems',
        include: [{
          model: Product,
          as: 'Product'
        }]
      }],
      transaction
    });

    if (!purchaseOrder) {
      throw new Error('Purchase order not found');
    }

    // Check if delivery date has changed and update status accordingly
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    const deliveryDate = updatedData.delivered_date ? new Date(updatedData.delivered_date) : null;
    if (deliveryDate) {
      deliveryDate.setHours(0, 0, 0, 0);
    }
    
    const isDelivered = deliveryDate && deliveryDate <= currentDate;

    // Update purchase order
    await purchaseOrder.update({
      vendor_id: updatedData.vendor_id,
      order_date: updatedData.order_date,
      delivered_date: updatedData.delivered_date,
      delivery_method: updatedData.delivery_method,
      status_id: isDelivered ? 3 : 1, // Update status based on delivery date
      payment_terms: updatedData.payment_terms,
      updated_at: sequelize.fn('NOW')
    }, { transaction });

    // Handle items update
    if (updatedData.PurchaseOrderItems) {
      // First get existing items to handle stock updates
      const existingItems = await PurchaseOrderItem.findAll({
        where: { purchase_order_id: purchaseOrderId },
        transaction
      });

      // Delete existing items
      await PurchaseOrderItem.destroy({
        where: { purchase_order_id: purchaseOrderId },
        transaction
      });

      // Create new items
      await PurchaseOrderItem.bulkCreate(
        updatedData.PurchaseOrderItems.map(item => ({
          purchase_order_id: purchaseOrderId,
          product_id: item.product_id,
          quantity: item.quantity,
          total_price: item.total_price
        })),
        { transaction }
      );

      // Update inventory if order is delivered
      if (isDelivered) {
        for (const item of updatedData.PurchaseOrderItems) {
          await Product.update(
            {
              product_stock: sequelize.literal(`product_stock + ${item.quantity}`),
              updated_at: sequelize.fn('NOW')
            },
            {
              where: { product_id: item.product_id },
              transaction
            }
          );
        }
      }
    }

    await transaction.commit();
    return purchaseOrder;

  } catch (error) {
    console.error('Error in handleUpdateOrder:', error);
    await transaction.rollback();
    throw error;
  }
};

exports.deletePurchaseOrder = async (purchaseOrderId, username, managerPassword) => {
  const transaction = await sequelize.transaction();
  
  try {
    // Verify manager password first
    const isValidManagerPassword = await verifyManagerPassword(managerPassword);
    if (!isValidManagerPassword) {
      throw new Error("Invalid manager password");
    }

    // Get purchase order with all related items
    const purchaseOrder = await PurchaseOrder.findOne({
      where: { purchase_order_id: purchaseOrderId },
      include: [{
        model: PurchaseOrderItem,
        as: 'PurchaseOrderItems',
        include: [{
          model: Product,
          as: 'Product'
        }]
      }],
      transaction
    });

    if (!purchaseOrder) {
      throw new Error("Purchase order not found");
    }

    let revertedQuantities = [];

    // If order was delivered (status_id === 3), revert inventory
    if (purchaseOrder.status_id === 3) {
      for (const item of purchaseOrder.PurchaseOrderItems) {
        await Product.update(
          {
            product_stock: sequelize.literal(`product_stock - ${item.quantity}`),
            updated_at: sequelize.fn('NOW')
          },
          {
            where: { product_id: item.product_id },
            transaction
          }
        );

        revertedQuantities.push({
          productName: item.Product.product_name,
          quantity: item.quantity,
          sku: item.Product.sku_number
        });
      }
    }

    // Delete purchase order items first
    await PurchaseOrderItem.destroy({
      where: { purchase_order_id: purchaseOrderId },
      transaction
    });

    // Delete purchase order taxes if they exist
    await PurchaseOrderTax.destroy({
      where: { purchase_order_id: purchaseOrderId },
      transaction
    });

    // Finally delete the purchase order
    await PurchaseOrder.destroy({
      where: { purchase_order_id: purchaseOrderId },
      transaction
    });

    await transaction.commit();

    return {
      message: purchaseOrder.status_id === 3 
        ? "Purchase order deleted and inventory quantities reverted successfully"
        : "Purchase order deleted successfully",
      inventoryReverted: purchaseOrder.status_id === 3,
      revertedQuantities
    };

  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};