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
const { Op, sequelize } = require("sequelize");
const bcrypt = require("bcryptjs");
const WarrantyService = require("./warrantyService");
const { WarrantyNotFoundException } = require("../errors/notFoundException");
const { DatabaseOperationException } = require("../errors/operationError");

exports.addProductUnit = async (purchaseOrderId, products) => {
  const transaction = await db.sequelize.transaction();
  try {
    await Promise.all(
      products.map(async (product) => {
        const warranty = await WarrantyService.getWarrantiesByProduct(
          product.productId
        );
        if (!warranty) {
          throw new WarrantyNotFoundException(product.productId);
        }

        const purchaseDate = new Date();

        await Promise.all(
          product.units.map(async (unit) => {
            try {
              const productUnit = await ProductUnit.create(
                {
                  warranty_id: warranty.warranty_id,
                  purchase_order_id: purchaseOrderId,
                  product_id: product.productId,
                  serial_number: unit.serialNumber,
                  date_of_purchase: purchaseDate,
                },
                { transaction }
              );

              const warrantyStartDate = new Date(purchaseDate);
              const warrantyEndDate = new Date(purchaseDate);
              warrantyEndDate.setMonth(
                warrantyEndDate.getMonth() + warranty.duration
              );

              await WarrantyUnit.create(
                {
                  product_unit_id: productUnit.product_unit_id,
                  warranty_id: warranty.warranty_id,
                  warranty_start: warrantyStartDate,
                  warranty_end: warrantyEndDate,
                  status: "ACTIVE",
                },
                { transaction }
              );
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

    if (
      err instanceof WarrantyNotFoundException ||
      err instanceof DatabaseOperationException
    ) {
      throw err;
    }

    throw new DatabaseOperationException("Failed to add product units", err);
  }
};


