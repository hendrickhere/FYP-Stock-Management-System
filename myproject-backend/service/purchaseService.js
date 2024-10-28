const { PurchaseOrder, User, Customer, Organization, PurchaseOrderItem, Product } = require("../models/association.js");

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
