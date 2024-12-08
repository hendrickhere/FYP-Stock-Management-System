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
const { WarrantyNotFoundException } = require("../errors/notFoundException");
const { DatabaseOperationException } = require("../errors/operationError");

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

              if (warranty.manufacturer) {
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

