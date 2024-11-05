const { PurchaseOrder, User, Customer, Organization, PurchaseOrderItem, Product, Vendor } = require("../models/association.js");
const sequelize = require("../db-config");


async function getUserByUsername(username) {
  const user = await User.findOne({
    where: {
      username: username,
    },
  });
  return user.dataValues;
}

exports.getAllPurchases = async (username, pageNumber, pageSize) => {
  const offset = (pageNumber - 1) * pageSize;
  try {
    const user = await User.findOne({
      where: { username },
      attributes: ["organization_id"],
    });

    if (!user) {
      throw new Error("No user found");
    }
    const organizationId = user.organization_id;

    const purchases = await PurchaseOrder.findAll({
      include: [
        {
          model: User,
          as: 'user', 
          attributes: ["username"],
          where: { organization_id: organizationId }, 
        },
        {
          model: Product,
          through: { attributes: [] }, 
          attributes: ["product_name", "sku_number", "price"],
        },
      ],
      limit: pageSize,
      offset: offset,
    });

    return purchases;
  } catch (err) {
    console.error("Error fetching purchase orders:", err);
    throw err;
  }
};

exports.insertPurchase = async (purchaseData) => {
  const user = await getUserByUsername(purchaseData.username);

  if (!user) {
    throw new Error("User not found");
  }
  const { itemsList, orderDate, totalAmount, deliveredDate, vendorSn } =
    purchaseData;

  const transaction = await sequelize.transaction();

  try {
    const vendor = getVendorByVendorUuid(vendorSn);

    const purchaseOrder = await PurchaseOrder.create(
      {
        order_date: orderDate,
        total_amount: totalAmount,
        deliveredDate: deliveredDate ?? new Date(0).toISOString(),
        vendor_id: vendor.vendor_id,
        status_id: 1,
        user_id: user.user_id,
        createdAt: new Date().toISOString(),
      },
      { transaction }
    );
    if (!purchaseOrder) {
      throw new Error("Failed to create Purchase Order");
    }

    for (const item of itemsList) {
      const itemObj = await getInventoryByUUID(item.uuid);
      if (!itemObj) {
        throw new Error(`Inventory item not found for UUID: ${item.uuid}`);
      }

      const price = itemObj.price * item.quantity;
      await PurchaseOrderItem.create(
        {
          purchase_order_id: purchaseOrder.purchase_order_id,
          product_id: itemObj.product_id,
          quantity: itemObj.quantity,
          total_price: price,
        },
        { transaction }
      );
    }
    await transaction.commit();
    return purchaseOrder;
  } catch (err) {
    await transaction.rollback();
    throw new Error(err.message);
  }
};

async function getVendorByVendorUuid(vendorUuid){
  const vendor = await Vendor.findOne({
    where: {
      vendorSn: vendorUuid
    }
  });

  return vendor.dataValues;
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