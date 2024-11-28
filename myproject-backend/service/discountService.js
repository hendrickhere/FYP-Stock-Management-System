const db = require("../models");
const DiscountError = require("../errors/discountError");
const { Op } = require("sequelize");
const Discount = db.Discount;
const Organization = db.Organization;

exports.createDiscount = async (reqBody) => {
  const {
    organizationId,
    discountName,
    discountRate,
    discountStart,
    discountEnd,
    description, 
  } = reqBody;
  const organization = await getOrganization(organizationId);
  if (!organization) {
    throw new DiscountError("Organization not found", "VALIDATION_ERROR", 400);
  }
  if (isNaN(parseFloat(discountRate))) {
    throw new DiscountError(
      "Discount rate must be a valid number",
      "VALIDATION_ERROR",
      400
    );
  }

  if (parseFloat(discountRate) < 0) {
    throw new DiscountError(
      "Discount rate cannot be negative",
      "VALIDATION_ERROR",
      400
    );
  }
  try {
    const discount = await Discount.create({
        organization_id: organizationId, 
        discount_name: discountName, 
        discount_rate: discountRate, 
        discount_start: discountStart,
        discount_end: discountEnd, 
        discount_status: 1, 
        description: description, 
      });

      return discount.dataValues; 
  } catch (err) {
    console.error("Discount Service Error:", err);

    if (err instanceof DiscountError) {
      throw err;
    }

    if (err.name === "SequelizeValidationError") {
      throw new DiscountError(
        `Validation error: ${err.errors.map((e) => e.message).join(", ")}`,
        "VALIDATION_ERROR",
        400
      );
    }

    if (err.name === "SequelizeUniqueConstraintError") {
      throw new DiscountError(
        "A discount with this name already exists",
        "DUPLICATE_ERROR",
        409
      );
    }

    if (err.name === "SequelizeForeignKeyConstraintError") {
      throw new DiscountError(
        "Invalid organization ID provided",
        "FOREIGN_KEY_ERROR",
        400
      );
    }

    if (err.name === "SequelizeDatabaseError") {
      throw new DiscountError("Database error occurred", "DATABASE_ERROR", 500);
    }

    throw new DiscountError(
      "An unexpected error occurred while creating the discount.",
      "INTERNAL_SERVER_ERROR",
      500
    ); 
  }
};

exports.getDiscounts = async (organizationId) => {
  const organization = await getOrganization(organizationId);
  if (!organization) {
    throw new DiscountError("Organization not found", "VALIDATION_ERROR", 400);
  }

  try {
    const currentDate = new Date();
    const discounts = await Discount.findAll({
      where: {
        organization_id: organizationId,
        discount_status: 1,
        [Op.or]: [
          { discount_end: null },  
          { discount_end: { [Op.gt]: currentDate } }  
        ]
      },
      attributes: [
        "discount_id",
        "discount_name",
        "discount_rate",
        "description",
        "discount_start",
        "discount_end",
      ],
    });

    return discounts.map((discount) => discount.dataValues);
  } catch (err) {
    throw new DiscountError(
      "Error retrieving discounts",
      "DATABASE_ERROR",
      500,
      err
    );
  }
};

exports.updateDiscount = async (discountId, updates) => {
  try{
    const discount = await Discount.findByPk(discountId);
    if(!discount){
      throw new DiscountError("Discount not found", "NOT_FOUND", 404);
    }
    if (updates.discount_rate !== undefined) {
      const rate = parseFloat(updates.discount_rate);
      if (isNaN(rate)) {
        throw new DiscountError("Invalid discount rate format", "VALIDATION_ERROR", 400);
      }
      if (rate < 0) {
        throw new DiscountError(
          "Discount rate cannot be negative",
          "VALIDATION_ERROR",
          400
        );
      }
      updates.discount_rate = rate;
  
      await discount.update(updates);
      await discount.reload();
  
      return discount; 
    }
  } catch (err){
    console.error("Discount Service Update Error:", err);

    if (err instanceof DiscountError) {
      throw err;
    }

    // if (err.name === "SequelizeUniqueConstraintError") {
    //   throw new DiscountError(
    //     "A discount with this name already exists",
    //     "DUPLICATE_ERROR",
    //     409
    //   );
    // }

    if (err.name === "SequelizeValidationError") {
      throw new DiscountError(
        `Validation error: ${err.errors.map((e) => e.message).join(", ")}`,
        "VALIDATION_ERROR",
        400
      );
    }

    throw new DiscountError("Failed to update discount", "INTERNAL_SERVER_ERROR", 500);
  }
  
}

exports.deleteDiscount = async (discountId) => {
  try {
    const discount = await Discount.findByPk(discountId);
    
    if (!discount || discount.discount_status === 0) {
      return { success: true };
    }

    await discount.update({ discount_status: 0 });
    return { success: true };
  } catch (err) {
    console.error("Discount Service Delete Error:", err);
    throw new DiscountError(
      "Failed to delete discount", 
      "INTERNAL_SERVER_ERROR", 
      500
    );
  }
};

exports.getDiscountByIdAsync = async (discountId) => {
  try{
    const discount = await Discount.findByPk(discountId);
    return discount.dataValues; 
  } catch (err) {
    console.error("Failed to fetch discount:", err);
    throw new DiscountError(
      "Failed to fetch discount", 
      "INTERNAL_SERVER_ERROR", 
      500
    );
  }
}
const getOrganization = async (organizationId) => {
  return await Organization.findOne({
    where: {
      organization_id: organizationId,
    },
    attributes: ['organization_name', 'organization_id'],
  });
};

