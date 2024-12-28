const db = require("../models");
const {
  PurchaseOrder,
  User,
  Warranty,
  Product,
  ProductUnit,
  WarrantyUnit,
  Vendor,
  PurchaseOrderItem,
  PurchaseOrderTax,
  sequelize,
} = db;
const { Op } = require("sequelize");
const bcrypt = require("bcryptjs");
const WarrantyService = require("./warrantyService");
const PurchaseService = require("./purchaseService");
const SalesService = require("./salesService");
const UserService = require("./userService");
const { WarrantyNotFoundException, ProductNotFoundException } = require("../errors/notFoundException");
const { DatabaseOperationException } = require("../errors/operationError");
const {ValidationException} = require("../errors/validationError");

exports.addProductUnit = async (purchaseOrderId, products, username) => {
  const transaction = await db.sequelize.transaction();
  try {
    await Promise.all(
      products.map(async (product) => {
        //const purchaseOrder = await PurchaseService.getPurchaseOrderDetails(purchaseOrderId, username);
        const warranty = await WarrantyService.getWarrantiesByProduct(
          product.product_id
        );
        const purchaseOrderItem = await PurchaseService.getPurchaseOrderItem(
          purchaseOrderId,
          product.product_id
        );

        const purchaseDate = new Date();
        
        if (product.units.length > purchaseOrderItem.unregistered_quantity) {
          throw new Error(`Cannot register more units than available unregistered quantity for product ${product.product_id}`);
        }

        await Promise.all(
          product.units.map(async (unit) => {
            try {
              const productUnit = await ProductUnit.create(
                {
                  warranty_id: warranty?.warranty_id || null, 
                  purchase_order_item_id: purchaseOrderItem.purchase_order_item_id,
                  product_id: product.product_id,
                  serial_number: unit.serialNumber,
                  date_of_purchase: purchaseDate,
                },
                { transaction }
              );

              if (warranty.manufacturer.length > 0) {
                const warrantyStartDate = new Date(purchaseDate);
                const warrantyEndDate = new Date(purchaseDate);
                warrantyEndDate.setMonth(
                  warrantyEndDate.getMonth() + warranty.manufacturer[0].duration
                );

                await WarrantyUnit.create(
                  {
                    product_unit_id: productUnit.product_unit_id,
                    warranty_id: warranty.manufacturer[0].warranty_id,
                    warranty_start: warrantyStartDate,
                    warranty_end: warrantyEndDate,
                    status: "ACTIVE",
                  },
                  { transaction }
                );
              }

              await PurchaseOrderItem.decrement('unregistered_quantity', {
                by: 1,
                where: { purchase_order_item_id: purchaseOrderItem.purchase_order_item_id },
                transaction
              });

              await Product.increment('product_stock', {
                by:1 ,
                where: {product_id: product.product_id},
                transaction
              });
            } catch (error) {
              throw new DatabaseOperationException(
                `Failed to create product unit for serial number: ${unit.serialNumber}`,
                error
              );
            }
          })
        );
      })
    );

    await transaction.commit();
    return { success: true };
  } catch (err) {
    await transaction.rollback();
    console.error("Error adding product units:", err);

    if (err instanceof DatabaseOperationException) {
      throw err;
    }

    throw new DatabaseOperationException("Failed to add product units", err);
  }
};

exports.sellProductUnit = async (salesOrderId, products) => {
  const transaction = await db.sequelize.transaction();
  try {
    await Promise.all(
      products.map(async (product, index) => {
        const warranty = await WarrantyService.getWarrantiesByProduct(
          product.product_id
        );
        const salesOrderItem = await SalesService.getSalesOrderItem(
          purchaseOrderId,
          product.product_id
        );
        const salesDate = new Date();
        if (product.units.length > salesOrderItem.unregistered_quantity) {
          throw new Error(`Cannot register more units than available unregistered quantity for product ${product.product_id}`);
        }
      })
    )
  } catch (err) {
    
  }
}

exports.getProductUnit = async (purchaseOrderId, productId) => {
  try {
    const productUnits = await ProductUnit.findAll({
      where: {
        product_id: productId,      
        purchase_order_item_id: purchaseOrderId
      },
      attributes: ["serial_number", "product_unit_id"]
    });

    return productUnits;
  } catch (err) {
    throw err;              
  }
};

exports.getProductUnitWithSerialNumber = async (serialNumber) => {
  try {
    if (!serialNumber) {
      throw new Error("Serial number is required");
    }

    const productUnit = await ProductUnit.findOne({
      where: {
        serial_number: serialNumber,
        is_sold: false
      }
    });

    if (!productUnit) {
      throw new ProductNotFoundException("Product unit not found or already sold");
    }

    return productUnit.dataValues;
  } catch (err) {
    console.error("Error in getProductUnitWithSerialNumber:", err);
    throw err; 
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

exports.addExistingUnit = async (serialNumbers, productId) => {
  const transaction = await db.sequelize.transaction();

  try {
      const itemObj = await getInventoryByUUID(productId);
      if (!itemObj) {
          throw new ProductNotFoundException(productId);
      }

      if (!Array.isArray(serialNumbers) || serialNumbers.length === 0) {
          throw new ValidationException("Serial numbers must be provided");
      }

      const uniqueSerials = new Set(serialNumbers);
      if (uniqueSerials.size !== serialNumbers.length) {
          throw new ValidationException("Duplicate serial numbers detected");
      }

      const existingUnits = await ProductUnit.findAll({
          where: {
              serial_number: serialNumbers,
              product_id: itemObj.product_id
          }
      });

      if (existingUnits.length > 0) {
          throw new ValidationException(
              `Serial numbers already exist: ${existingUnits.map(unit => unit.serial_number).join(', ')}`
          );
      }

      const warranty = await WarrantyService.getWarrantiesByProduct(itemObj.product_id);

      const createdUnits = await Promise.all(
        serialNumbers.map(async (serialNumber) => {
          const unitData = {
            product_id: itemObj.product_id,
            serial_number: serialNumber,
            source_type: "INITIAL_STOCK",
            is_sold: false,
            date_of_purchase: null,
            purchase_order_item_id: null,
          };
      
          if (warranty.manufacturer.length > 0) {
            const warrantyStartDate = new Date();
            const warrantyEndDate = new Date(warrantyStartDate);
            warrantyEndDate.setMonth(
              warrantyStartDate.getMonth() + warranty.manufacturer[0].duration
            );
      
            unitData.warranty_start_date = warrantyStartDate;
            unitData.warranty_end_date = warrantyEndDate;
          }
      
          const productUnit = await ProductUnit.create(unitData, { transaction });
      
          if (warranty.manufacturer.length > 0) {
            await WarrantyUnit.create({
              product_unit_id: productUnit.product_unit_id,
              warranty_id: warranty.manufacturer[0].warranty_id,
              warranty_start: productUnit.warranty_start_date,
              warranty_end: productUnit.warranty_end_date,
              status: "ACTIVE",
            }, { transaction });
          }
          return productUnit;
        })
      );
      
      await Product.decrement('unregistered_quantity', {
        by: serialNumbers.length,
        where: { product_id: itemObj.product_id },
        transaction
      });

      await transaction.commit();
      return createdUnits;
  } catch (err) {
      await transaction.rollback();
      console.error("Error adding existing units:", err);
      
      if (err instanceof ValidationException || err instanceof ProductNotFoundException) {
          throw err;
      }
      throw new DatabaseOperationException("Failed to add existing units", err);
  }
};

exports.getProductUnitsWithProductId = async (productId, pageNumber, pageSize, searchTerm) => {
  const offset = (pageNumber - 1) * pageSize;
  const itemObj = await getInventoryByUUID(productId);
  if(!itemObj){
    throw ProductNotFoundException(productId);
  }
  let whereClause = {
    product_id: itemObj.product_id,
  };
  
  if (searchTerm) {
    whereClause = {
      ...whereClause,
      [Op.or]: {
        serial_number: {
          [Op.iLike]: `%${searchTerm}%`,
        },
      },
    };
  }
  
  const { count, rows: productUnits } = await ProductUnit.findAndCountAll({
    distinct: true,
    where: whereClause,
    attributes: [
      "serial_number",
      "product_id",
      "created_at",
      "updated_at",
      "source_type",
      "date_of_purchase",
      "date_of_sale",
    ],
    include: [{
      model: WarrantyUnit,
      attributes: [
        "warranty_unit_id",
        "warranty_start",
        "warranty_end",
        "status",
        "notification_sent"
      ],
      required: false, 
      include: [{
        model: Warranty,
        attributes: [
          "warranty_type",
          "description",
          "terms",
          "duration"
        ]
      }]
    }],
    limit: pageSize,
    offset: offset,
    order: [["created_at", "DESC"]],
  }); 
  
  const totalPages = Math.ceil(count / pageSize);
  const hasNextPage = pageNumber < totalPages;
  const hasPreviousPage = pageNumber > 1;

  const result = {
    productUnits: productUnits,
    pagination: {
      totalItems: count,
      totalPages,
      currentPage: parseInt(pageNumber),
      pageSize: parseInt(pageSize),
      hasNextPage,
      hasPreviousPage
    }
  };
  
  return result;
};