const db = require("../models");
const TaxError = require("../errors/taxError");

const Tax = db.Tax;

exports.getTaxes = async (organizationId) => {
  try {
    const taxes = await Tax.findAll({
      where: {
        organization_id: organizationId,
        tax_status: 1,
      },
      order: [["created_at", "DESC"]],
    });

    return taxes;
  } catch (err) {
    console.error("Tax Service Error:", err);

    if (err.name === "SequelizeDatabaseError") {
      throw new TaxError(
        "Database error occurred while retrieving taxes",
        "DATABASE_ERROR",
        500
      );
    }

    throw new TaxError(
      "Failed to retrieve taxes",
      "INTERNAL_SERVER_ERROR",
      500
    );
  }
};
exports.createTax = async (requestBody) => {
  const { taxName, taxRate, description, organizationId } = requestBody;

  try {
    // Validate tax rate is a valid number
    if (isNaN(parseFloat(taxRate))) {
      throw new TaxError(
        "Tax rate must be a valid number",
        "VALIDATION_ERROR",
        400
      );
    }

    // Validate tax rate is not negative
    if (parseFloat(taxRate) < 0) {
      throw new TaxError(
        "Tax rate cannot be negative",
        "VALIDATION_ERROR",
        400
      );
    }

    const tax = await Tax.create({
      tax_name: taxName,
      tax_rate: taxRate,
      description: description,
      organization_id: organizationId,
      tax_status: 1,
      created_at: new Date().toISOString(),
    });

    return tax.dataValues;
  } catch (err) {
    console.error("Tax Service Error:", err);

    // If it's already our custom error, throw it as is
    if (err instanceof TaxError) {
      throw err;
    }

    // Handle Sequelize specific errors
    if (err.name === "SequelizeValidationError") {
      throw new TaxError(
        `Validation error: ${err.errors.map((e) => e.message).join(", ")}`,
        "VALIDATION_ERROR",
        400
      );
    }

    if (err.name === "SequelizeUniqueConstraintError") {
      throw new TaxError(
        "A tax with this name already exists",
        "DUPLICATE_ERROR",
        409
      );
    }

    if (err.name === "SequelizeForeignKeyConstraintError") {
      throw new TaxError(
        "Invalid organization ID provided",
        "FOREIGN_KEY_ERROR",
        400
      );
    }

    if (err.name === "SequelizeDatabaseError") {
      throw new TaxError("Database error occurred", "DATABASE_ERROR", 500);
    }

    // For any other unexpected errors
    throw new TaxError(
      "An unexpected error occurred while creating the tax",
      "INTERNAL_SERVER_ERROR",
      500
    );
  }
};

exports.updateTax = async (taxId, updates) => {
  try {
    const tax = await Tax.findByPk(taxId);

    if (!tax) {
      throw new TaxError("Tax not found", "NOT_FOUND", 404);
    }

    if (updates.tax_rate !== undefined) {
      const rate = parseFloat(updates.tax_rate);
      if (isNaN(rate)) {
        throw new TaxError("Invalid tax rate format", "VALIDATION_ERROR", 400);
      }
      if (rate < 0) {
        throw new TaxError(
          "Tax rate cannot be negative",
          "VALIDATION_ERROR",
          400
        );
      }
      updates.tax_rate = rate;
    }

    await tax.update(updates);

    await tax.reload();

    return tax;
  } catch (err) {
    console.error("Tax Service Update Error:", err);

    if (err instanceof TaxError) {
      throw err;
    }

    if (err.name === "SequelizeUniqueConstraintError") {
      throw new TaxError(
        "A tax with this name already exists",
        "DUPLICATE_ERROR",
        409
      );
    }

    if (err.name === "SequelizeValidationError") {
      throw new TaxError(
        `Validation error: ${err.errors.map((e) => e.message).join(", ")}`,
        "VALIDATION_ERROR",
        400
      );
    }

    throw new TaxError("Failed to update tax", "INTERNAL_SERVER_ERROR", 500);
  }
};

exports.deleteTax = async (taxId) => {
  try {
    const tax = await Tax.findByPk(taxId);
    if (!tax) {
      return { success: true }; 
    }

    await tax.destroy();
    return { success: true };
  } catch (err) {
    console.error("Tax Service Delete Error:", err);
    throw new TaxError("Failed to delete tax", "INTERNAL_SERVER_ERROR", 500);
  }
};
