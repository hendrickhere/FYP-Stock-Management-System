const bcrypt = require('bcrypt');
const {
  User,
  SalesOrder,
  SalesOrderInventory,
  Customer,
  Product,
  Discount,
  Tax,
  SalesOrderTax,
  SalesOrderDiscount,
  Organization,
  sequelize
} = require("../models");
const { SalesError, InvalidTimeRangeError, UserNotFoundError, DatabaseError } = require("../errors/salesError");
const { ValidationError, Op, where } = require("sequelize");
// Add debug logging
console.log("Loaded models:", {
  User: !!User,
  SalesOrder: !!SalesOrder,
  SalesOrderInventory: !!SalesOrderInventory,
  Customer: !!Customer,
  Product: !!Product,
});

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

async function getSalesOrderByUUID(salesOrderUUID) {
  const salesOrder = await SalesOrder.findOne({
    where: {
      sales_order_uuid: salesOrderUUID,
    },
  });

  return salesOrder.dataValues;
}

async function getUserByUsername(username) {
  const user = await User.findOne({
    where: {
      username: username,
    },
  });
  return user.dataValues;
}

exports.getSalesOrderTotal = async (username, salesOrderUUID) => {
  const user = await getUserByUsername(username);
  if (!user) {
    throw new Error("User not found");
  }

  const salesOrder = await SalesOrder.findOne({
    where: {
      sales_order_uuid: salesOrderUUID,
      organization_id: user.organization_id,
    },
  });

  if (!salesOrder) {
    throw new Error(`No sales order found under user ${username}`);
  }

  const salesOrdersInventories = SalesOrderInventory.findAll({
    where: {
      sales_order_id: salesOrder.sales_order_id,
    },
  });
  let total = 0;
  for (const salesOrder of salesOrdersInventories) {
    total += salesOrder.price;
  }
  return total;
};

exports.getAllSalesOrders = async (username, pageNumber, pageSize) => {
  const offset = (pageNumber - 1) * pageSize;
  try {
    const user = await User.findOne({
      where: {
        username: username,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const salesOrders = await SalesOrder.findAll({
      where: {
        organization_id: user.organization_id,
      },
      include: [
        {
          model: Customer,
          required: false,
          attributes: [
            "customer_name",
            "customer_designation",
            "shipping_address",
          ],
        },
        {
          model: Product,
          through: {
            model: SalesOrderInventory,
            attributes: ["quantity", "price"],
          },
        },
        {
          model: Discount,
          through: {
            model: SalesOrderDiscount,
            attributes: ["applied_discount_rate", "discount_amount"],
          },
          as: "discounts",
        },
        {
          model: Tax,
          through: {
            model: SalesOrderTax, 
            attributes: ["applied_tax_rate", "tax_amount"]
          },
          as: "taxes"
        }
      ],
      order: [["order_date_time", "DESC"]],
      limit: pageSize,
      offset: offset,
    });

    return {
      salesOrders: salesOrders.map((order) => ({
        sales_order_id: order.sales_order_id,
        sales_order_uuid: order.sales_order_uuid,
        order_date_time: order.order_date_time,
        expected_shipment_date: order.expected_shipment_date,
        customer: order.Customer || null,
        grandtotal: order.grand_total,
        subtotal: order.subtotal,
        discounts: order.discounts,
        taxes: order.taxes,
        discountAmount: order.discount_amount,
        totalTax: order.total_tax,
        inventories: order.items || [],
      })),
    };
  } catch (error) {
    console.error("Error in getAllSalesOrders service:", error);
    return { salesOrders: [] };
  }
};

const validateItemLists = (itemLists) => {
  if (!Array.isArray(itemLists) || itemLists.length === 0) {
    throw new ValidationSalesError("Item list must be a non-empty array");
  }

  itemLists.forEach((item, index) => {
    if (!item.product_id) {
      throw new ValidationSalesError(
        `Missing product_id in item at index ${index}`
      );
    }
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new ValidationSalesError(
        `Invalid quantity for product ${item.product_id}. Must be a positive integer.`
      );
    }
  });
};

exports.calculateSalesOrderTotal = async (reqBody) => {
  try {
    if (!reqBody || typeof reqBody !== "object") {
      throw new ValidationSalesError("Invalid request body");
    }

    const { itemLists, taxIds = [], discountIds = [] } = reqBody;

    if (!itemLists) {
      throw new ValidationSalesError("Item list is required");
    }
    validateItemLists(itemLists);

    let subtotal = 0;
    let grandtotal = 0;
    let totalDiscountAmount = 0;
    let totalTaxAmount = 0;
    let discountRatesDto = [];
    let taxRatesDto = [];

    const pricePromises = itemLists.map(async (item) => {
      try {
        return await getItemPrice(item.product_id);
      } catch (error) {
        if (error instanceof SalesError) {
          error.message = `Error fetching price for item ${item.product_id}: ${error.message}`;
        }
        throw error;
      }
    });

    const prices = await Promise.all(pricePromises);

    itemLists.forEach((item, index) => {
      subtotal += prices[index].price * item.quantity;
    });

    grandtotal = subtotal;

    if (discountIds.length > 0) {
      try {
        const discountRates = await getDiscountRates(discountIds);
        
        discountRates.forEach((discount) => {
          if (discount.discount_rate < 0 || discount.discount_rate > 1) {
            throw new SalesError(
              `Invalid discount rate: ${discount.discount_rate}`,
              "VALIDATION_ERROR",
              400
            );
          }
          
          const discountAmount = subtotal * discount.discount_rate;
          discountRatesDto.push({
            discount_id: discount.discount_id,
            discount_name: discount.discount_name,
            discount_rate: discount.discount_rate,
            discount_amount: Number(discountAmount.toFixed(2))
          });
          totalDiscountAmount += discountAmount;
        });
        
        grandtotal = grandtotal - totalDiscountAmount;
      } catch (error) {
        throw error;
      }
    }

    if (taxIds.length > 0) {
      try {
        const taxRates = await getTaxRates(taxIds);
        
        taxRates.forEach((tax) => {
          if (tax.tax_rate < 0 || tax.tax_rate > 1) {
            throw new SalesError(
              `Invalid tax rate: ${tax.tax_rate}`,
              "VALIDATION_ERROR",
              400
            );
          }
          
          const taxAmount = grandtotal * tax.tax_rate;
          taxRatesDto.push({
            tax_id: tax.tax_id,
            tax_name: tax.tax_name,
            tax_rate: tax.tax_rate,
            tax_amount: Number(taxAmount.toFixed(2))
          });
          totalTaxAmount += taxAmount;
        });
        
        grandtotal = grandtotal + totalTaxAmount;
      } catch (error) {
        throw error;
      }
    }

    return {
      subtotal: Number(subtotal.toFixed(2)),
      grandtotal: Number(grandtotal.toFixed(2)),
      totalDiscountAmount: Number(totalDiscountAmount.toFixed(2)),
      totalTaxAmount: Number(totalTaxAmount.toFixed(2)),
      discounts: discountRatesDto,
      taxes: taxRatesDto
    };
  } catch (err) {
    if (err instanceof SalesError) {
      throw err;
    }
    throw new SalesError(
      "Failed to calculate sales total",
      "INTERNAL_SERVER_ERROR",
      500
    );
  }
};

async function getDiscountRates(discountIds) {
  const discounts = await Discount.findAll({
    where: {
      discount_id: {
        [Op.in]: discountIds
      }
    },
    attributes: ["discount_id", "discount_rate", "discount_name"]
  });

  if (!discounts.length) {
    throw new SalesError(
      `No discounts found for ids: ${discountIds.join(", ")}`,
      "NOT_FOUND", 
      404
    );
  }

  return discounts.map(discount => discount.dataValues);
}

async function getTaxRates(taxIds) {
  const taxes = await Tax.findAll({
    where: {
      tax_id: {
        [Op.in]: taxIds  
      }
    },
    attributes: ["tax_id", "tax_rate", "tax_name"]
  });

  if (!taxes.length) {
    throw new SalesError(
      `No taxes found for ids: ${taxIds.join(", ")}`,
      "NOT_FOUND",
      404
    );
  }

  return taxes.map(tax => tax.dataValues);
}
async function getItemPrice(itemId) {
  const price = await Product.findOne({
    where: {
      product_uuid: itemId,
    },
    attributes: ["price"],
  });

  if (!price) {
    throw new SalesError(
      `Product with id ${itemId} not found`,
      "NOT_FOUND",
      404
    );
  }

  return price.dataValues;
}

exports.getAllSalesOrders = async (username) => {
  try {
    const user = await User.findOne({
      where: { username },
    });
    const salesOrders = await SalesOrder.findAll({
      where: {
        organization_id: user.organization_id,
      },
      include: [
        {
          model: Customer,
          required: true,
          attributes: [
            "customer_uuid",
            "customer_name",
            "customer_contact",
            "customer_designation",
            "customer_company",
            "shipping_address",
          ],
        },
        {
          model: Product,
          through: {
            model: SalesOrderInventory,
            as: "sales_order_items", 
            attributes: ["quantity", "price", "discounted_price"],
          },
          attributes: [
            "product_id", 
            "product_uuid",
            "product_name",
            "sku_number",
            "description",
          ],
        },
      ],
      order: [["order_date_time", "DESC"]],
    });

    // Debug log
    console.log(
      "Raw sales orders:",
      JSON.stringify(salesOrders[0]?.get({ plain: true }), null, 2)
    );

    const result = {
      salesOrders: salesOrders.map((order) => {
        const plainOrder = order.get({ plain: true });
        return {
          ...plainOrder,
          Customer: {
            ...plainOrder.Customer,
            customer_contact: plainOrder.Customer?.customer_contact || "N/A",
          },
          products:
            plainOrder.Products?.map((product) => ({
              product_id: product.product_id,
              product_uuid: product.product_uuid,
              product_name: product.product_name,
              sku_number: product.sku_number,
              product_description: product.description,
              sales_order_items: {
                quantity: product.SalesOrderInventory?.quantity || 0,
                price: product.SalesOrderInventory?.price || 0,
              },
            })) || [],
        };
      }),
    };

    // Debug log
    console.log(
      "Transformed result:",
      JSON.stringify(result.salesOrders[0], null, 2)
    );

    return result;
  } catch (error) {
    console.error("Error in getAllSalesOrders service:", error);
    throw error;
  }
};
const getTodayDateRange = () => {
  const today = new Date();
  
  const startDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    0, 0, 0, 0
  );
  
  const endDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    23, 59, 59, 999
  );
  
  return { startDate, endDate };
};
exports.getSalesOrderTotalWithTimeRange = async (username, timeRange) => {
if (!username) {
    throw new SalesError('Username is required', 400);
  }
  const parsedTimeRange = parseInt(timeRange);
  if (isNaN(parsedTimeRange) || parsedTimeRange <= 0) {
    throw new InvalidTimeRangeError('Time range must be a positive number');
  }

  const MAX_TIME_RANGE = 365 * 24 * 60 * 60 * 1000;
  if (parsedTimeRange > MAX_TIME_RANGE) {
    throw new InvalidTimeRangeError('Time range cannot exceed 1 year');
  }

  try {
    const user = await User.findOne({ where: { username } });
    if (!user) {
      throw new UserNotFoundError(username);
    }
    let startDate = new Date();
    let endDate = new Date(startDate.getTime() + parsedTimeRange);
    switch (parsedTimeRange) {
      case 86400000: {
        const todayRange = getTodayDateRange();
        startDate = todayRange.startDate;
        endDate = todayRange.endDate;
        break;
      }
    }
    

    const salesOrders = await SalesOrder.findAll({
      where: {
        organization_id: user.organization_id,
        order_date_time: {
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('grand_total')), 'totalSales']
      ],
      raw: true
    });

    return salesOrders[0]?.totalSales || 0;

  } catch (error) {
    console.error('Sales order query error:', error);
    if (error instanceof SalesError) {
      throw error;
    }
    
    throw new DatabaseError(
      'An error occurred while fetching sales data: ' + error.message
    );
  }
};

exports.createSalesOrder = async (username, salesData) => {
  const transaction = await sequelize.transaction();

  try {
    const user = await User.findOne({
      where: { username },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const customer = await Customer.findOne({
      where: { customer_uuid: salesData.customerUUID },
    });

    if (!customer) {
      throw new Error("Customer not found");
    }

    const salesOrderData = {
      order_date_time: new Date(),
      expected_shipment_date: salesData.expectedShipmentDate,
      payment_terms: salesData.paymentTerms,
      delivery_method: salesData.deliveryMethod,
      status_id: 1,
      customer_id: customer.customer_id,
      user_id: user.user_id,
      organization_id: user.organization_id,
      subtotal: salesData.subtotal,
      grand_total: salesData.grandtotal,
      total_tax: salesData.totalTax,
      discount_amount: salesData.discountAmount,
    };

    console.log("Creating sales order with data:", salesOrderData);

    const salesOrder = await SalesOrder.create(salesOrderData, { transaction });
    let totalDiscountRate = 0;

    if (salesData.discounts && salesData.discounts.length > 0) {
      const salesDiscounts = salesData.discounts.map((discount) => {
        totalDiscountRate += discount.discount_rate;
        return {
          sales_order_id: salesOrder.sales_order_id,
          discount_id: discount.discount_id,
          applied_discount_rate: discount.discount_rate,
          discount_amount: discount.discount_amount,
        };
      });
      await SalesOrderDiscount.bulkCreate(salesDiscounts, { transaction });
    }

    if (salesData.itemsList && salesData.itemsList.length > 0) {
      const orderItems = [];
      await Promise.all(
        salesData.itemsList.map(async (item) => {
          const itemObj = await getInventoryByUUID(item.uuid);
          
          const leftoverStock = itemObj.product_stock - item.quantity;
          if (leftoverStock < 0) {
            throw new Error(
              "Unable to create sales order due to low stock volume, please try again after stock volume is increased."
            );
          }
          await Product.update(
            { product_stock: leftoverStock },
            {
              where: {
                product_id: itemObj.product_id,
              },
              transaction,
            }
          );
          orderItems.push({
            sales_order_id: salesOrder.sales_order_id,
            product_id: itemObj.product_id,
            quantity: item.quantity,
            price: item.price,
            discounted_price:
              totalDiscountRate > 0 ? item.price * (1 - totalDiscountRate) : null,
            status_id: 1,
          });
        })
      );
      await SalesOrderInventory.bulkCreate(orderItems, { transaction });
    }

    if (salesData.taxes && salesData.taxes.length > 0) {
      const salesTaxes = salesData.taxes.map((tax) => ({
        sales_order_id: salesOrder.sales_order_id,
        tax_id: tax.tax_id,
        applied_tax_rate: tax.tax_rate,
        tax_amount: tax.tax_amount,
      }));
      await SalesOrderTax.bulkCreate(salesTaxes, { transaction });
    }

    await transaction.commit();
    return salesOrder;
  } catch (error) {
    await transaction.rollback();
    console.error("Error in createSalesOrder:", error);
    throw error;
  }
};

exports.getAvailableProducts = async (username) => {
  try {
    const user = await User.findOne({
      where: { username }
    });

    if (!user) {
      throw new Error("User not found");
    }

    const products = await Product.findAll({
      where: {
        organization_id: user.organization_id,
        status_id: 1 // Assuming 1 is active status
      },
      attributes: [
        'product_id',
        'product_uuid',
        'product_name',
        'sku_number',
        'product_stock',
        'unit',
        'price',
        'description'
      ],
      raw: true 
    });

    return {
      success: true,
      products: products
    };
  } catch (error) {
    console.error('Error fetching available products:', error);
    throw error;
  }
};
async function getInventoryByUUID(uuid) {
  const inventory = await Product.findOne({
    where: {
      status_id: 1, 
      product_uuid: uuid,
    }
  }); 
  return inventory; 
}

exports.updateSalesOrder = async (username, salesOrderUUID, updatedData, managerPassword) => {
  const transaction = await sequelize.transaction();
  
  try {
    const user = await User.findOne({
      where: { username },
      transaction
    });

    if (!user) {
      throw new SalesError("User not found", "AUTH_ERROR", 401);
    }

    // Verify manager password
    if (!managerPassword) {
      throw new SalesError("Manager password is required", "INVALID_MANAGER_PASSWORD", 401);
    }

    const isValidManagerPassword = await verifyManagerPassword(managerPassword);
    if (!isValidManagerPassword) {
      throw new SalesError("The password doesn't match any manager's password", "INVALID_MANAGER_PASSWORD", 401);
    }

    const isValid = await bcrypt.compare(managerPassword, user.password_hash);
    if (!isValid) {
      throw new SalesError("Invalid manager password", "INVALID_MANAGER_PASSWORD", 401);  // Changed error code
    }

    const salesOrder = await SalesOrder.findOne({
      where: {
        sales_order_uuid: salesOrderUUID,
        organization_id: user.organization_id,
      },
      include: [{
        model: SalesOrderInventory,
        as: 'items'
      }],
      transaction
    });

    if (!salesOrder) {
      throw new Error("Sales order not found");
    }

    // Get current order items for comparison
    const currentItems = await SalesOrderInventory.findAll({
      where: { sales_order_id: salesOrder.sales_order_id },
      transaction
    });

    // Update basic sales order information
    await salesOrder.update({
      expected_shipment_date: updatedData.expected_shipment_date,
      payment_terms: updatedData.payment_terms,
      delivery_method: updatedData.delivery_method,
      customer_id: updatedData.customer_id,
    }, { transaction });

    // Create a map of current quantities
    const currentQuantities = new Map(
      currentItems.map(item => [item.product_id, item.quantity])
    );

    // If there are updated products, handle them
    if (updatedData.products && updatedData.products.length > 0) {
      // First, delete existing inventory items
      await SalesOrderInventory.destroy({
        where: {
          sales_order_id: salesOrder.sales_order_id
        },
        transaction
      });

      // Process each product
      for (const product of updatedData.products) {
        const currentQty = currentQuantities.get(product.product_id) || 0;
        const newQty = product.sales_order_items.quantity;
        const quantityDiff = newQty - currentQty;

        // Update product stock
        const productRecord = await Product.findByPk(product.product_id, { transaction });
        if (productRecord) {
          if (quantityDiff > 0) {
            // Deduct additional stock
            await productRecord.decrement('product_stock', { 
              by: quantityDiff,
              transaction 
            });
          } else if (quantityDiff < 0) {
            // Return stock
            await productRecord.increment('product_stock', { 
              by: Math.abs(quantityDiff),
              transaction 
            });
          }
        }
      }

      // Create new sales order items
      const inventoryItems = updatedData.products.map(product => ({
        sales_order_id: salesOrder.sales_order_id,
        product_id: product.product_id,
        quantity: product.sales_order_items.quantity,
        price: product.sales_order_items.price,
        status_id: 1
      }));

      await SalesOrderInventory.bulkCreate(inventoryItems, { transaction });
    }

    await transaction.commit();

    // Fetch updated order with all associations
    const updatedOrder = await SalesOrder.findOne({
      where: { sales_order_uuid: salesOrderUUID },
      include: [
        {
          model: Customer,
          attributes: [
            "customer_id",
            "customer_uuid",
            "customer_name",
            "customer_designation",
            "customer_email",
            "customer_contact",
            "customer_company",
            "shipping_address",
          ],
        },
        {
          model: Product,
          through: {
            model: SalesOrderInventory,
            attributes: ["quantity", "price"],
          },
        },
      ],
    });

    return updatedOrder;
  } catch (error) {
    await transaction.rollback();
    console.error("Error in updateSalesOrder:", error);
    throw error;
  }
};

exports.deleteSalesOrder = async (username, salesOrderUUID, managerPassword) => {
  const transaction = await sequelize.transaction();
  
  try {
    const user = await User.findOne({
      where: { username },
      transaction
    });

    if (!user) {
      throw new SalesError('User not found', 'AUTH_ERROR', 401);
    }

    const isValidManagerPassword = await verifyManagerPassword(managerPassword);
    if (!isValidManagerPassword) {
      throw new SalesError("The password doesn't match any manager's password", "INVALID_MANAGER_PASSWORD", 401);
    }

    const isPasswordValid = await bcrypt.compare(managerPassword, user.password_hash);
    if (!isPasswordValid) {
      throw new SalesError('Invalid manager password', "INVALID_MANAGER_PASSWORD", 401);  
    }

    const salesOrder = await SalesOrder.findOne({
      where: {
        sales_order_uuid: salesOrderUUID,
        organization_id: user.organization_id
      },
      include: [{
        model: SalesOrderInventory,
        as: 'items'
      }],
      transaction
    });

    if (!salesOrder) {
      throw new SalesError('Sales order not found', 'NOT_FOUND', 404);
    }

    // Stock restoration
    if (salesOrder?.items?.length > 0) {
      for (const item of salesOrder.items) {
        const product = await Product.findByPk(item.product_id, { transaction });
        if (product) {
          await product.increment('product_stock', { 
            by: item.quantity,
            transaction 
          });
        }
      }
    }

    // Delete related records
    await Promise.all([
      SalesOrderInventory.destroy({
        where: { sales_order_id: salesOrder.sales_order_id },
        transaction
      }),
      SalesOrderTax.destroy({
        where: { sales_order_id: salesOrder.sales_order_id },
        transaction
      }),
      SalesOrderDiscount.destroy({
        where: { sales_order_id: salesOrder.sales_order_id },
        transaction
      })
    ]);

    await salesOrder.destroy({ transaction });
    await transaction.commit();
    
    return {
      success: true,
      message: 'Sales order deleted successfully',
      deletedOrderId: salesOrder.sales_order_uuid
    };

  } catch (error) {
    await transaction.rollback();
    console.error('Error in deleteSalesOrder service:', error);
    
    if (error instanceof SalesError) {
      throw error;
    }
    
    throw new SalesError(
      'Failed to delete sales order',
      'INTERNAL_SERVER_ERROR',
      500
    );
  }
};
