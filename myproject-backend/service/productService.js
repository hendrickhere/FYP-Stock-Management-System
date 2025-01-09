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
const { WarrantyNotFoundException, ProductNotFoundException, ProductUnitNotFoundException } = require("../errors/notFoundException");
const { DatabaseOperationException } = require("../errors/operationError");
const { ValidationException } = require("../errors/validationError");

const productService = {
  addProductUnit: async (purchaseOrderId, products, username) => {
    const transaction = await db.sequelize.transaction();
    try {
      await Promise.all(
        products.map(async (product) => {
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
          
          const serialNumberValidations = await Promise.all(
            product.units.map(async (unit) => {
              const existingUnit = await ProductUnit.findOne({
                where: {
                  serial_number: unit.serialNumber,
                  product_id: product.product_id
                }
              });

              if (existingUnit) {
                return {
                  serialNumber: unit.serialNumber,
                  exists: true,
                  product_id: product.product_id
                };
              }
              return {
                serialNumber: unit.serialNumber,
                exists: false,
                product_id: product.product_id
              };
            })
          );

          const existingSerialNumbers = serialNumberValidations.filter(validation => validation.exists);
          if (existingSerialNumbers.length > 0) {
            throw new ValidationException(
              `Serial numbers already exist: ${existingSerialNumbers.map(v => v.serialNumber).join(', ')}`
            );
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
      if(err instanceof ValidationException){
        throw err;
      }

      throw new DatabaseOperationException("Failed to add product units", err);
    }
  },

  sellProductUnit: async (salesOrderId, products) => {
    const transaction = await db.sequelize.transaction();
    try {
      await Promise.all(
        products.map(async (product, index) => {
          const warranty = await WarrantyService.getWarrantiesByProduct(
            product.product_id
          );
          const salesOrderItem = await SalesService.getSalesOrderItem(
            salesOrderId,
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
  },

  getProductUnit: async (purchaseOrderId, productId) => {
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
  },

  getProductUnitWithSerialNumber: async (serialNumber) => {
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
        throw new ProductUnitNotFoundException([serialNumber]);
      }

      return productUnit.dataValues;
    } catch (err) {
      console.error("Error in getProductUnitWithSerialNumber:", err);
      throw err; 
    }
  },

  getInventoryByUUID: async (uuid) => {
    const inventory = await Product.findOne({
      where: {
        status_id: 1, 
        product_uuid: uuid,
      }
    }); 
    return inventory; 
  },

  addExistingUnit: async (serialNumbers, productId) => {
    const transaction = await db.sequelize.transaction();

    try {
      const itemObj = await productService.getInventoryByUUID(productId);
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
              warranty_start: unitData.warranty_start_date,
              warranty_end: unitData.warranty_end_date,
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
  },

  getProductUnitsWithProductId: async (productId, pageNumber, pageSize, searchTerm) => {
    const offset = (pageNumber - 1) * pageSize;
    const itemObj = await productService.getInventoryByUUID(productId);
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
        "is_sold"
      ],
      include: [{
        model: WarrantyUnit,
        where: {
          status: "ACTIVE"
        },
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
  },

  getProductUnitWithWarrantyUnit: async (serialNumber, product_id) => {
    try {
      const productUnitsWithWarranty = await ProductUnit.findAll({
        where: {
          serial_number: {
            [Op.like]: `%${serialNumber}%`  // This will match any serial number containing the input string
          },
          product_id: product_id,
        },
        include: [{
          model: WarrantyUnit,
          required: false,
          where: {
            status: 'ACTIVE'
          },
          include: [{
            model: Warranty,
            attributes: ['warranty_type', 'duration', 'warranty_number']
          }]
        }, {
          model: Product,
          attributes: ['product_name', 'sku_number']
        }],
        // Limit the results to prevent too many matches
        limit: 10
      });

      if (!productUnitsWithWarranty || productUnitsWithWarranty.length === 0) {
        throw new Error('No product units found matching the search criteria');
      }

      // Map the results to get clean data values
      const results = productUnitsWithWarranty.map(unit => unit.dataValues);
      
      return results;
    } catch (error) {
      throw error;
    }
  },

  getExpiringProducts: async () => {
    const twoMonthsFromNow = new Date();
    twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + 2);
    
    const products = await Product.findAll({
      where: {
        expiry_date: {
          [Op.and]: [
            { [Op.not]: null },
            { [Op.lte]: twoMonthsFromNow },
            { [Op.gt]: new Date() }
          ]
        },
        product_stock: {
          [Op.gt]: 0
        },
        is_expiry_goods: true
      },
      attributes: [
        'product_id',
        'product_name',
        'product_stock',
        'expiry_date',
        'sku_number',
        'brand'
      ],
      order: [['expiry_date', 'ASC']]
    });

    console.log('Found expiring products:', products.length);
    return products;
  }
};

module.exports = productService;