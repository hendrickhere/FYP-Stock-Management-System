const bcrypt = require("bcryptjs");
const {
  User,
  SalesOrder,
  SalesOrderInventory,
  Customer,
  Product,
  Discount,
  Tax,
  ProductUnit,
  SalesOrderTax,
  SalesOrderDiscount,
  Organization,
  WarrantyUnit,
  ReturnRecord, 
  ProductUnitReturn, 
  Warranty,
  sequelize,
} = require("../models");
const {
  SalesError,
  InvalidTimeRangeError,
  UserNotFoundError,
  DatabaseError,
} = require("../errors/salesError");
const { ValidationException } = require("../errors/validationError");
const { ProductUnitNotFoundException } = require("../errors/notFoundException");
const { ValidationError, Op, where } = require("sequelize");
const { getDiscountByIdAsync } = require("../service/discountService");
const WarrantyService = require("./warrantyService");
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
        role: "Manager",
      },
    });

    // Check against all manager passwords
    for (const manager of managers) {
      const isValid = await bcrypt.compare(
        managerPassword,
        manager.password_hash
      );
      if (isValid) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error("Error verifying manager password:", error);
    return false;
  }
}

exports.getSalesOrderByUUID = async (salesOrderUuid) => {
  const salesOrder = await SalesOrder.findOne({
    where: { sales_order_uuid: salesOrderUuid },
    include: [
      {
        model: Organization,
        attributes: ['organization_name', 'organization_account_number', 'organization_address', 'organization_contact', 'organization_bank', 'organization_email']
      },
      {
        model: SalesOrderInventory,
        as: 'items',
        include: [{
          model: Product,
          as: 'Product',
          attributes: ['product_name']
        }]
      },
      {
        model: Discount,
        through: {
          model: SalesOrderDiscount,
          attributes: ['applied_discount_rate', 'discount_amount']
        }
      },
      {
        model: Tax,
        through: {
          model: SalesOrderTax,
          attributes: ['applied_tax_rate', 'tax_amount']
        }
      },
      {
        model: Customer,
        attributes: [
          'customer_name',
          'customer_email',
          'customer_company',
          'billing_address',
          'shipping_address',
          'customer_contact'
        ]
      }
    ]
  });
  if (!salesOrder) {
    throw new SalesError('Sales order not found');
  }
  return salesOrder
}

exports.getSalesOrdersByUUID = async (salesOrderIds) => {
  const salesOrders = await SalesOrder.findAll({
    where: {
      sales_order_uuid: {
        [Op.in]: salesOrderIds
      }
    }
  });

  return salesOrders.map(order => order.dataValues);
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

exports.getSalesOrderReturn = async (organizationId, pageSize, pageNumber) => {
  let whereClause = {
    organization_id: organizationId
  };
  const offset = (pageNumber - 1) * pageSize;
  const returns = await ReturnRecord.findAndCountAll({
    where: whereClause,
    include: [{
      model: ProductUnitReturn,
      include: [{
        model: ProductUnit,
        include: [{
          model: Product,
          attributes: ['product_name', 'sku_number']
        }]
      }]
    }],
    order: [['created_at', 'DESC']],
    limit: pageSize,
    offset: offset,
    distinct: true
  });
  const totalPages = Math.ceil(returns.count / pageSize);
  const hasNextPage = pageNumber < totalPages;
  const hasPreviousPage = pageNumber > 1;

  return {
    returns: returns.rows,
    pagination: {
      totalItems: returns.count,
      totalPages,
      currentPage: parseInt(pageNumber),
      pageSize: parseInt(pageSize),
      hasNextPage,
      hasPreviousPage
    }
  };
}
// exports.getAllSalesOrders = async (username, pageNumber, pageSize) => {
//   const offset = (pageNumber - 1) * pageSize;
//   try {
//     const user = await User.findOne({
//       where: {
//         username: username,
//       },
//     });

//     if (!user) {
//       throw new Error("User not found");
//     }

//     const salesOrders = await SalesOrder.findAll({
//       where: {
//         organization_id: user.organization_id,
//       },
//       include: [
//         {
//           model: Customer,
//           required: false,
//           attributes: [
//             "customer_name",
//             "customer_designation",
//             "shipping_address",
//           ],
//           as: "customer"
//         },
//         {
//           model: Product,
//           through: {
//             model: SalesOrderInventory,
//             attributes: ["quantity", "price"],
//           },
//           as: "products"
//         },
//         {
//           model: Discount,
//           through: {
//             model: SalesOrderDiscount,
//             attributes: ["applied_discount_rate", "discount_amount"],
//           },
//           as: "discounts",
//         },
//         {
//           model: Tax,
//           through: {
//             model: SalesOrderTax,
//             attributes: ["applied_tax_rate", "tax_amount"]
//           },
//           as: "taxes"
//         }
//       ],
//       order: [["order_date_time", "DESC"]],
//       limit: pageSize,
//       offset: offset,
//     });

//     return {
//       salesOrders: salesOrders.map((order) => ({
//         sales_order_id: order.sales_order_id,
//         sales_order_uuid: order.sales_order_uuid,
//         order_date_time: order.order_date_time,
//         expected_shipment_date: order.expected_shipment_date,
//         customer: order.Customer || null,
//         grandtotal: order.grand_total,
//         subtotal: order.subtotal,
//         discounts: order.discounts,
//         taxes: order.taxes,
//         products: order.products,
//         discountAmount: order.discount_amount,
//         totalTax: order.total_tax,
//       })),
//     };
//   } catch (error) {
//     console.error("Error in getAllSalesOrders service:", error);
//     return { salesOrders: [] };
//   }
// };

const validateItemLists = (itemLists) => {
  if (!Array.isArray(itemLists) || itemLists.length === 0) {
    throw new ValidationException("Item list must be a non-empty array");
  }

  itemLists.forEach((item, index) => {
    if (!item.product_id) {
      throw new ValidationException(
        `Missing product_id in item at index ${index}`
      );
    }
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new ValidationException(
        `Invalid quantity for product ${item.product_id}. Must be a positive integer.`
      );
    }
  });
};

exports.returnSalesOrder = async (validatedData) => {
  const { products, sales_order_uuid, processed_by, reason, date_of_return } = validatedData;
  const transaction = await sequelize.transaction();
  const productIds = products.map(p => p.product_id);
  try {
    const salesOrder = await SalesOrder.findOne({
      where: { sales_order_uuid: sales_order_uuid },
      include: [
        {
          model: SalesOrderInventory,
          as: 'items',
          attributes: ['sales_order_item_id', 'quantity', 'price', 'discounted_price', 'product_id'],
          where: {
            product_id: {
              [Op.in]: productIds
            }
          },
          required: false 
        }
      ]
    });
    
    if (!salesOrder) {
      throw new Error('Sales order not found');
    }
  
    const processorUser = await User.findOne({
      where: { username: processed_by }
    });
  
    if (!processorUser) {
      throw new Error('User not found');
    }
    const productUnitIds = products.flatMap(p => 
      p.product_units.map(u => u.product_unit_id)
    );

    const productUnits = await ProductUnit.findAll({
      where: {
        product_unit_id: productUnitIds,
        is_sold: true
      },
      include: [{
        model: SalesOrderInventory,
        as: "salesOrderItem",
        where: {
          sales_order_id: salesOrder.sales_order_id
        },
        required: true
      }],
      transaction
    });
    
    if (productUnits.length !== productUnitIds.length) {
     throw new Error('Some product units do not belong to this sales order');
    }
    const existingReturns = await ProductUnitReturn.findAll({
      where: {
        product_unit_id: productUnitIds,
      },
      include: [{
        model: ReturnRecord,
        where: {
          sales_order_id: salesOrder.sales_order_id
        }
      }],
      transaction
    });
    
    if (existingReturns.length > 0) {
      throw new Error('Some products have already been returned');
    }
    await ProductUnit.update(
      {
        is_sold: false,
        date_of_sale: null, 
        sales_order_id: null,
        updated_at: new Date()
      },
      {
        where: {
          product_unit_id: {
            [Op.in]: productUnitIds
          }
        },
        transaction,
        validate: false
      }
    );

    const warrantyUnits = await WarrantyUnit.findAll({
      include: [{
        model: Warranty,
        where: {
          warranty_type: 1 
        },
        required: true
      }],
      where: {
        product_unit_id: {
          [Op.in]: productUnitIds
        },
        status: 'ACTIVE'
      },
      transaction
    });
    
    if (warrantyUnits.length > 0) {
      await WarrantyUnit.update(
        {
          status: 'VOID',
          updated_at: new Date()
        },
        {
          where: {
            warranty_unit_id: {
              [Op.in]: warrantyUnits.map(wu => wu.warranty_unit_id)
            }
          },
          transaction
        }
      );
    }

    const returnedProductCounts = products.reduce((acc, product) => {
      acc[product.product_id] = product.product_units.length;
      return acc;
    }, {});
    
    
    await Promise.all(
      Object.entries(returnedProductCounts).map(([productId, quantity]) => 
        Product.increment('product_stock', {
          by: quantity,
          where: { product_id: productId },
          transaction
        })
      )
    );
    console.log('returnedProductCounts:', returnedProductCounts);
    console.log('salesOrder.items:', JSON.stringify(salesOrder.items, null, 2));



    let totalRefundAmount = salesOrder.items.reduce((total, item) => {
      const numUnitsReturned = returnedProductCounts[item.product_id] || 0;
      const unitPrice = item.discounted_price || item.price;
      
      console.log('Product ID:', item.product_id);
      console.log('Units returned:', numUnitsReturned);
      console.log('Unit price:', unitPrice);
      console.log('Subtotal:', unitPrice * numUnitsReturned);
      
      return total + (unitPrice * numUnitsReturned);
    }, 0);

    const taxRate = salesOrder.total_tax / (salesOrder.subtotal - salesOrder.discount_amount) ;
    const refundedTax = totalRefundAmount * taxRate;

    const returnRecord = await ReturnRecord.create({
      sales_order_id: salesOrder.sales_order_id,
      return_date: date_of_return,
      refund_amount: totalRefundAmount,
      reason: reason,
      processed_by: processorUser.user_id,
      refunded_tax: refundedTax,
      organization_id: processorUser.organization_id,
    }, { transaction });

    const productUnitReturns = await Promise.all(
      products.flatMap(product => {
        const salesOrderItem = salesOrder.items.find(item => item.product_id === product.product_id);
        const unitPrice = salesOrderItem.discounted_price || salesOrderItem.price;
        const unitTax = (unitPrice * taxRate);
  
        return product.product_units.map(unit => 
          ProductUnitReturn.create({
            return_record_id: returnRecord.return_record_id,
            product_unit_id: unit.product_unit_id,
            refund_amount: unitPrice,
            refunded_tax: unitTax
          }, { transaction })
        );
      })
    );
    await transaction.commit();
    return returnRecord;
  } catch (err) {
    await transaction.rollback();
    console.log(err.message);
    throw err;
  }
}


exports.calculateSalesOrderTotal = async (reqBody) => {
  try {
    if (!reqBody || typeof reqBody !== "object") {
      throw new ValidationException("Invalid request body");
    }

    const { itemLists, taxIds = [], discountIds = [] } = reqBody;

    if (!itemLists) {
      throw new ValidationException("Item list is required");
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
            discount_amount: Number(discountAmount.toFixed(2)),
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
            tax_amount: Number(taxAmount.toFixed(2)),
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
      taxes: taxRatesDto,
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

exports.getSalesOrderItem = async (salesOrderId, productId) => {
  const salesOrderItem = SalesOrderInventory.findOne({
    where: {
      sales_order_id: salesOrderId,
      product_id: productId,
    },
  });
  return salesOrderItem;
};

async function getDiscountRates(discountIds) {
  const discounts = await Discount.findAll({
    where: {
      discount_id: {
        [Op.in]: discountIds,
      },
    },
    attributes: ["discount_id", "discount_rate", "discount_name"],
  });

  if (!discounts.length) {
    throw new SalesError(
      `No discounts found for ids: ${discountIds.join(", ")}`,
      "NOT_FOUND",
      404
    );
  }

  return discounts.map((discount) => discount.dataValues);
}

async function getTaxRates(taxIds) {
  const taxes = await Tax.findAll({
    where: {
      tax_id: {
        [Op.in]: taxIds,
      },
    },
    attributes: ["tax_id", "tax_rate", "tax_name"],
  });

  if (!taxes.length) {
    throw new SalesError(
      `No taxes found for ids: ${taxIds.join(", ")}`,
      "NOT_FOUND",
      404
    );
  }

  return taxes.map((tax) => tax.dataValues);
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

exports.getAllSalesOrders = async (
  username,
  pageSize,
  pageNumber,
  searchConfig
) => {
  try {
    const user = await User.findOne({
      where: { username },
    });

    const offset = (pageNumber - 1) * pageSize;

    let whereClause = {
      organization_id: user.organization_id,
    };

    if (searchConfig?.term) {
      const searchTerm = searchConfig.term.toLowerCase().trim();
      const activeFilters = searchConfig.activeFilters || [];

      const searchConditions = activeFilters
        .map((filter) => {
          switch (filter) {
            case "orderId":
              return sequelize.where(
                sequelize.cast(
                  sequelize.col("SalesOrder.sales_order_uuid"),
                  "text"
                ),
                { [Op.iLike]: `%${searchTerm}%` }
              );
            case "orderDate":
              return sequelize.where(
                sequelize.fn(
                  "TO_CHAR",
                  sequelize.col("order_date_time"),
                  "YYYY-MM-DD HH24:MI:SS"
                ),
                { [Op.iLike]: `%${searchTerm}%` }
              );
            case "shipmentDate":
              return sequelize.where(
                sequelize.fn(
                  "TO_CHAR",
                  sequelize.col("expected_shipment_date"),
                  "YYYY-MM-DD HH24:MI:SS"
                ),
                { [Op.iLike]: `%${searchTerm}%` }
              );
            case "totalPrice":
              return sequelize.where(
                sequelize.cast(sequelize.col("grand_total"), "varchar"),
                { [Op.iLike]: `%${searchTerm}%` }
              );
            case "deliveryMethod":
              return {
                delivery_method: {
                  [Op.iLike]: `%${searchTerm}%`,
                },
              };
            case "paymentTerms":
              return {
                payment_terms: {
                  [Op.iLike]: `%${searchTerm}%`,
                },
              };
            case "status":
              return sequelize.where(
                sequelize.cast(
                  sequelize.col("SalesOrder.status_id"),
                  "varchar"
                ),
                { [Op.iLike]: `%${searchTerm}%` }
              );
            case "customerName":
              return {
                "$Customer.customer_name$": {
                  [Op.iLike]: `%${searchTerm}%`,
                },
              };
            default:
              return null;
          }
        })
        .filter(Boolean);

      if (searchConditions.length > 0) {
        whereClause = {
          ...whereClause,
          [Op.or]: searchConditions,
        };
      }
    }

    const { count, rows: salesOrders } = await SalesOrder.findAndCountAll({
      distinct: true,
      where: whereClause,
      include: [
        {
          model: Customer,
          required: true,
          attributes: [
            "customer_uuid",
            "customer_name",
            "customer_contact",
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
            as: "items",
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
        {
          model: SalesOrderInventory,
          as: "items",
          include: [
            {
              model: ProductUnit,
              as: "productUnits",
              attributes: ["product_unit_id", "serial_number"],
            },
          ],
        },
        {
          model: Discount,
          through: {
            model: SalesOrderDiscount,
            as: "sales_order_discounts",
            attributes: ["applied_discount_rate", "discount_amount"],
          },
          attributes: ["discount_name", "discount_rate"],
        },
        {
          model: Tax,
          through: {
            model: SalesOrderTax,
            as: "sales_order_taxes",
            attributes: ["applied_tax_rate", "tax_amount"],
          },
          attributes: ["tax_name", "tax_rate"],
        },
      ],
      order: [["order_date_time", "DESC"]],
      limit: parseInt(pageSize),
      offset: offset,
    });

    const totalPages = Math.ceil(count / pageSize);
    const hasNextPage = pageNumber < totalPages;
    const hasPreviousPage = pageNumber > 1;

    const result = {
      salesOrders: salesOrders.map((order) => {
        const plainOrder = order.get({ plain: true });
        return {
          ...plainOrder,
          Customer: {
            ...plainOrder.Customer,
            customer_contact: plainOrder.Customer?.customer_contact || "N/A",
          },
        };
      }),
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: parseInt(pageNumber),
        pageSize: parseInt(pageSize),
        hasNextPage,
        hasPreviousPage,
      },
    };

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
    0,
    0,
    0,
    0
  );

  const endDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    23,
    59,
    59,
    999
  );

  return { startDate, endDate };
};
exports.getSalesOrderTotalWithTimeRange = async (username, timeRange) => {
  if (!username) {
    throw new SalesError("Username is required", 400);
  }
  const parsedTimeRange = parseInt(timeRange);
  if (isNaN(parsedTimeRange) || parsedTimeRange <= 0) {
    throw new InvalidTimeRangeError("Time range must be a positive number");
  }

  const MAX_TIME_RANGE = 365 * 24 * 60 * 60 * 1000;
  if (parsedTimeRange > MAX_TIME_RANGE) {
    throw new InvalidTimeRangeError("Time range cannot exceed 1 year");
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
          [Op.between]: [startDate, endDate],
        },
      },
      attributes: [
        [sequelize.fn("SUM", sequelize.col("grand_total")), "totalSales"],
      ],
      raw: true,
    });

    return salesOrders[0]?.totalSales || 0;
  } catch (error) {
    console.error("Sales order query error:", error);
    if (error instanceof SalesError) {
      throw error;
    }

    throw new DatabaseError(
      "An error occurred while fetching sales data: " + error.message
    );
  }
};
const validateSerialNumbers = async (
  productId,
  serialNumbers,
  quantity,
  transaction
) => {
  if (serialNumbers.length !== quantity) {
    throw new ValidationException(
      "Number of serial numbers must match the item quantity."
    );
  }

  const productUnits = await ProductUnit.findAll({
    where: {
      product_id: productId,
      serial_number: {
        [Op.in]: serialNumbers,
      },
    },
    lock: true,
    transaction,
  });

  if (productUnits.length !== serialNumbers.length) {
    throw new ProductUnitNotFoundException(serialNumbers);
  }

  const soldUnits = productUnits.filter((unit) => unit.is_sold);
  if (soldUnits.length > 0) {
    throw new ValidationException(
      `Units with serial numbers ${soldUnits
        .map((u) => u.serial_number)
        .join(", ")} are already sold`
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

    //discount validation
    if (
      salesData.discounts &&
      Array.isArray(salesData.discounts) &&
      salesData.discounts.length > 0
    ) {
      for (const discount of salesData.discounts) {
        const currentDiscount = await getDiscountByIdAsync(
          discount.discount_id
        );
        const currentDate = new Date();
        if (new Date(currentDiscount.discount_start) > currentDate) {
          throw new SalesError(
            "Discount hasn't started yet",
            "VALIDATION_ERROR",
            "400"
          );
        }
        if (
          currentDiscount.discount_end &&
          new Date(currentDiscount.discount_end) < currentDate
        ) {
          throw new SalesError(
            "Discount has expired",
            "VALIDATION_ERROR",
            "400"
          );
        }
      }
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

          if (item.serialNumbers) {
            const uniqueSerials = new Set(item.serialNumbers);
            if (uniqueSerials.size !== item.serialNumbers.length) {
              throw new ValidationException(
                "Duplicate serial numbers provided"
              );
            }
            await validateSerialNumbers(
              itemObj.product_id,
              item.serialNumbers,
              item.quantity,
              transaction
            );
          }

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
          const salesOrderItem = await SalesOrderInventory.create(
            {
              sales_order_id: salesOrder.sales_order_id,
              product_id: itemObj.product_id,
              quantity: item.quantity,
              price: item.price,
              discounted_price:
                totalDiscountRate > 0
                  ? item.price * (1 - totalDiscountRate)
                  : null,
              status_id: 1,
            },
            { transaction }
          );

          orderItems.push(salesOrderItem);
          const currentDate = new Date();
          if (item.serialNumbers) {
            const productUnits = await ProductUnit.findAll({
              where: {
                product_id: itemObj.product_id,
                serial_number: {
                  [Op.in]: item.serialNumbers,
                },
                is_sold: false  
              },
              lock: true,  
              transaction
            });
          
            if (productUnits.length !== item.serialNumbers.length) {
              throw new SalesError("Some serial numbers are not available or already sold");
            }
          
            await ProductUnit.update(
              {
                is_sold: true,
                sales_order_item_id: salesOrderItem.sales_order_item_id,
                date_of_sale: currentDate,
              },
              {
                where: {
                  product_unit_id: {
                    [Op.in]: productUnits.map(unit => unit.product_unit_id)
                  }
                },
                fields: ['is_sold', 'sales_order_item_id', 'date_of_sale'],
                transaction,
                validate: false
              }
            );
          
            try {
              const warranty = await WarrantyService.getWarrantiesByProduct(
                itemObj.product_id
              );
          
              if (warranty && warranty.consumer && warranty.consumer.length > 0) {
                const warrantyStartDate = new Date();
                const warrantyEndDate = new Date();
                warrantyEndDate.setMonth(
                  warrantyEndDate.getMonth() + warranty.consumer[0].duration
                );
          
                const warrantyUnits = productUnits.map(productUnit => ({
                  product_unit_id: productUnit.product_unit_id,
                  warranty_id: warranty.consumer[0].warranty_id,
                  warranty_start: warrantyStartDate,
                  warranty_end: warrantyEndDate,
                  status: "ACTIVE",
                }));
          
                await WarrantyUnit.bulkCreate(warrantyUnits, { transaction });
              }
            } catch (error) {
              console.error('Error creating warranty units:', error);
              throw new Error('Failed to create warranty units: ' + error.message);
            }
          }
        })
      );
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
      where: { username },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const products = await Product.findAll({
      where: {
        organization_id: user.organization_id,
        status_id: 1, // Assuming 1 is active status
      },
      attributes: [
        "product_id",
        "product_uuid",
        "product_name",
        "sku_number",
        "product_stock",
        "unit",
        "price",
        "description",
      ],
      raw: true,
    });

    return {
      success: true,
      products: products,
    };
  } catch (error) {
    console.error("Error fetching available products:", error);
    throw error;
  }
};
async function getInventoryByUUID(uuid) {
  const inventory = await Product.findOne({
    where: {
      status_id: 1,
      product_uuid: uuid,
    },
  });
  return inventory;
}

exports.updateSalesOrder = async (
  username,
  salesOrderUUID,
  updatedData,
  managerPassword
) => {
  const transaction = await sequelize.transaction();

  try {
    const user = await User.findOne({
      where: { username },
      transaction,
    });

    if (!user) {
      throw new SalesError("User not found", "AUTH_ERROR", 401);
    }

    // Verify manager password
    if (!managerPassword) {
      throw new SalesError(
        "Manager password is required",
        "INVALID_MANAGER_PASSWORD",
        401
      );
    }

    const isValidManagerPassword = await verifyManagerPassword(managerPassword);
    if (!isValidManagerPassword) {
      throw new SalesError(
        "The password doesn't match any manager's password",
        "INVALID_MANAGER_PASSWORD",
        401
      );
    }

    const isValid = await bcrypt.compare(managerPassword, user.password_hash);
    if (!isValid) {
      throw new SalesError(
        "Invalid manager password",
        "INVALID_MANAGER_PASSWORD",
        401
      ); // Changed error code
    }

    const salesOrder = await SalesOrder.findOne({
      where: {
        sales_order_uuid: salesOrderUUID,
        organization_id: user.organization_id,
      },
      include: [
        {
          model: SalesOrderInventory,
          as: "items",
        },
      ],
      transaction,
    });

    if (!salesOrder) {
      throw new Error("Sales order not found");
    }

    // Get current order items for comparison
    const currentItems = await SalesOrderInventory.findAll({
      where: { sales_order_id: salesOrder.sales_order_id },
      transaction,
    });

    // Update basic sales order information
    await salesOrder.update(
      {
        expected_shipment_date: updatedData.expected_shipment_date,
        payment_terms: updatedData.payment_terms,
        delivery_method: updatedData.delivery_method,
        customer_id: updatedData.customer_id,
      },
      { transaction }
    );

    // Create a map of current quantities
    const currentQuantities = new Map(
      currentItems.map((item) => [item.product_id, item.quantity])
    );

    // If there are updated products, handle them
    if (updatedData.products && updatedData.products.length > 0) {
      // First, delete existing inventory items
      await SalesOrderInventory.destroy({
        where: {
          sales_order_id: salesOrder.sales_order_id,
        },
        transaction,
      });

      // Process each product
      for (const product of updatedData.products) {
        const currentQty = currentQuantities.get(product.product_id) || 0;
        const newQty = product.sales_order_items.quantity;
        const quantityDiff = newQty - currentQty;

        // Update product stock
        const productRecord = await Product.findByPk(product.product_id, {
          transaction,
        });
        if (productRecord) {
          if (quantityDiff > 0) {
            // Deduct additional stock
            await productRecord.decrement("product_stock", {
              by: quantityDiff,
              transaction,
            });
          } else if (quantityDiff < 0) {
            // Return stock
            await productRecord.increment("product_stock", {
              by: Math.abs(quantityDiff),
              transaction,
            });
          }
        }
      }

      // Create new sales order items
      const inventoryItems = updatedData.products.map((product) => ({
        sales_order_id: salesOrder.sales_order_id,
        product_id: product.product_id,
        quantity: product.sales_order_items.quantity,
        price: product.sales_order_items.price,
        status_id: 1,
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

exports.deleteSalesOrder = async (
  username,
  salesOrderUUID,
  managerPassword
) => {
  const transaction = await sequelize.transaction();

  try {
    const user = await User.findOne({
      where: { username },
      transaction,
    });

    if (!user) {
      throw new SalesError("User not found", "AUTH_ERROR", 401);
    }

    const isValidManagerPassword = await verifyManagerPassword(managerPassword);
    if (!isValidManagerPassword) {
      throw new SalesError(
        "The password doesn't match any manager's password",
        "INVALID_MANAGER_PASSWORD",
        401
      );
    }

    const isPasswordValid = await bcrypt.compare(
      managerPassword,
      user.password_hash
    );
    if (!isPasswordValid) {
      throw new SalesError(
        "Invalid manager password",
        "INVALID_MANAGER_PASSWORD",
        401
      );
    }

    const salesOrder = await SalesOrder.findOne({
      where: {
        sales_order_uuid: salesOrderUUID,
        organization_id: user.organization_id,
      },
      include: [
        {
          model: SalesOrderInventory,
          as: "items",
        },
      ],
      transaction,
    });

    if (!salesOrder) {
      throw new SalesError("Sales order not found", "NOT_FOUND", 404);
    }

    // Stock restoration
    if (salesOrder?.items?.length > 0) {
      for (const item of salesOrder.items) {
        const product = await Product.findByPk(item.product_id, {
          transaction,
        });
        if (product) {
          await product.increment("product_stock", {
            by: item.quantity,
            transaction,
          });
        }
      }
    }

    // Delete related records
    await Promise.all([
      SalesOrderInventory.destroy({
        where: { sales_order_id: salesOrder.sales_order_id },
        transaction,
      }),
      SalesOrderTax.destroy({
        where: { sales_order_id: salesOrder.sales_order_id },
        transaction,
      }),
      SalesOrderDiscount.destroy({
        where: { sales_order_id: salesOrder.sales_order_id },
        transaction,
      }),
    ]);

    await salesOrder.destroy({ transaction });
    await transaction.commit();

    return {
      success: true,
      message: "Sales order deleted successfully",
      deletedOrderId: salesOrder.sales_order_uuid,
    };
  } catch (error) {
    await transaction.rollback();
    console.error("Error in deleteSalesOrder service:", error);

    if (error instanceof SalesError) {
      throw error;
    }

    throw new SalesError(
      "Failed to delete sales order",
      "INTERNAL_SERVER_ERROR",
      500
    );
  }
};

async function getFastMovingItems(username, timeRange = 30) {
  // This will aggregate sales data over the specified time range
  // Default to last 30 days if not specified
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - timeRange);

  try {
    // Get user's organization
    const user = await User.findOne({ where: { username } });

    // Join sales_order_items with products and aggregate quantities
    const fastMovingItems = await SalesOrderInventory.findAll({
      attributes: [
        "product_id",
        [sequelize.fn("SUM", sequelize.col("quantity")), "total_quantity"],
        [sequelize.fn("COUNT", sequelize.col("sales_order_id")), "order_count"],
        [sequelize.literal("SUM(quantity) / " + timeRange), "daily_velocity"],
      ],
      include: [
        {
          model: SalesOrder,
          where: {
            order_date_time: {
              [Op.gte]: startDate,
            },
            organization_id: user.organization_id,
          },
          attributes: [],
        },
        {
          model: Product,
          attributes: ["product_name", "sku_number", "product_stock"],
        },
      ],
      group: [
        "product_id",
        "Product.product_name",
        "Product.sku_number",
        "Product.product_stock",
      ],
      having: sequelize.literal("COUNT(sales_order_id) > 0"),
      order: [[sequelize.literal("total_quantity"), "DESC"]],
      limit: 5,
    });

    return fastMovingItems;
  } catch (error) {
    throw new Error("Error calculating fast-moving items: " + error.message);
  }
}

exports.getFastMovingItemsAnalytics = async (username, options) => {
  try {
    const user = await User.findOne({
      where: { username },
    });

    if (!user) {
      throw new SalesError("User not found", "AUTH_ERROR", 401);
    }

    // Base query using the correct association
    const baseQuery = {
      attributes: [
        "product_id",
        [
          sequelize.fn("SUM", sequelize.col("SalesOrderInventory.quantity")),
          "total_quantity",
        ],
        [
          sequelize.fn(
            "COUNT",
            sequelize.fn("DISTINCT", sequelize.col("SalesOrder.sales_order_id"))
          ),
          "order_count",
        ],
      ],
      include: [
        {
          model: Product,
          as: "Product",
          required: true,
          attributes: ["product_name", "sku_number", "product_stock"],
        },
        {
          model: SalesOrder,
          required: true,
          attributes: [],
          where: {
            organization_id: user.organization_id,
            // Add date range filter if needed
            order_date_time: {
              [Op.gte]: sequelize.literal(
                `CURRENT_DATE - INTERVAL '${options.timeRange} days'`
              ),
            },
          },
        },
      ],
      group: [
        "SalesOrderInventory.product_id",
        "Product.product_id",
        "Product.product_name",
        "Product.sku_number",
        "Product.product_stock",
      ],
      order: [[sequelize.literal("total_quantity"), "DESC"]],
      limit: options.limit || 5,
    };

    // Execute query with proper error handling
    const results = await SalesOrderInventory.findAll(baseQuery);

    // Transform results into a cleaner format
    const transformedResults = results.map((result) => ({
      productId: result.product_id,
      productName: result.Product.product_name,
      skuNumber: result.Product.sku_number,
      totalQuantity: parseInt(result.getDataValue("total_quantity")),
      orderCount: parseInt(result.getDataValue("order_count")),
      currentStock: result.Product.product_stock,
    }));

    return {
      success: true,
      data: {
        fastMovingItems: transformedResults,
        analyzedAt: new Date(),
        timeRange: options.timeRange,
      },
    };
  } catch (error) {
    console.error("Analytics service error:", error);
    throw error;
  }
};



// Helper functions
function getSortExpression(sortBy) {
  const expressions = {
    quantity: "SUM(quantity)",
    velocity: "SUM(quantity)::float / ${timeRange}",
    turnover: 'SUM(quantity)::float / NULLIF("Product"."product_stock", 0)',
    value: "SUM(quantity * price)",
  };
  return expressions[sortBy] || expressions.quantity;
}

async function getPreviousPeriodData(baseQuery, startDate, endDate) {
  const query = {
    ...baseQuery,
    include: [
      {
        ...baseQuery.include[0],
        where: {
          ...baseQuery.include[0].where,
          order_date_time: {
            [Op.between]: [startDate, endDate],
          },
        },
      },
      baseQuery.include[1],
    ],
  };
  return await SalesOrderInventory.findAll(query);
}

async function getCategoryBreakdown(organizationId, startDate, endDate) {
  return await SalesOrderInventory.findAll({
    attributes: [
      [sequelize.col("Product.category"), "category"],
      [sequelize.fn("SUM", sequelize.col("quantity")), "total_quantity"],
      [
        sequelize.fn(
          "COUNT",
          sequelize.fn("DISTINCT", sequelize.col("product_id"))
        ),
        "unique_products",
      ],
    ],
    include: [
      {
        model: SalesOrder,
        where: {
          order_date_time: { [Op.between]: [startDate, endDate] },
          organization_id: organizationId,
        },
        attributes: [],
      },
      {
        model: Product,
        attributes: [],
      },
    ],
    group: [sequelize.col("Product.category")],
  });
}

async function enrichAnalyticsData(currentData, previousData, timeRange) {
  const items = currentData.map((item) => {
    const plainItem = item.get({ plain: true });
    const previousItem = previousData.find(
      (p) => p.product_id === item.product_id
    );

    // Calculate period-over-period changes
    const previousQuantity = previousItem?.total_quantity || 0;
    const quantityChange =
      ((plainItem.total_quantity - previousQuantity) / previousQuantity) * 100;

    // Calculate velocity and momentum
    const velocity = plainItem.total_quantity / timeRange;
    const previousVelocity = previousQuantity / timeRange;
    const velocityChange =
      ((velocity - previousVelocity) / previousVelocity) * 100;

    // Calculate turnover rate
    const turnoverRate =
      plainItem.total_quantity / (plainItem.Product.product_stock || 1);

    return {
      ...plainItem,
      metrics: {
        quantityChange: parseFloat(quantityChange.toFixed(2)),
        velocityChange: parseFloat(velocityChange.toFixed(2)),
        turnoverRate: parseFloat(turnoverRate.toFixed(2)),
        velocity: parseFloat(velocity.toFixed(2)),
        reorderPoint: calculateReorderPoint(plainItem, velocity),
      },
    };
  });

  // Calculate overall trends
  const trends = calculateOverallTrends(items);

  return { items, trends };
}

function calculateReorderPoint(item, velocity) {
  const leadTime = 7; // Assumed 7 days lead time
  const safetyStock = Math.ceil(velocity * 3); // 3 days safety stock
  return Math.ceil(velocity * leadTime + safetyStock);
}

function calculateOverallTrends(items) {
  return {
    averageVelocity:
      items.reduce((acc, item) => acc + item.metrics.velocity, 0) /
      items.length,
    averageTurnover:
      items.reduce((acc, item) => acc + item.metrics.turnoverRate, 0) /
      items.length,
    totalQuantityChange:
      items.reduce((acc, item) => acc + item.metrics.quantityChange, 0) /
      items.length,
  };
}
