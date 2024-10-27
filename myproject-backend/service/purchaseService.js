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

    const purchases = await PurchaseOrder.findAll({
      include: [
        {
          model: User,
          attributes: ["username"],
          where: { username: username },
          include: [
            {
              model: Organization,
              attributes: ["organization_name"],
            },
          ],
        },
        {
          model: Product,
          through: { attributes: [] },
        },
      ],
      limit: pageSize,
    offset: offset,
    });

    return purchases;
  } catch (err) {
    console.error("Error fetching purchase orders:", error);
    throw err;
  }
};
