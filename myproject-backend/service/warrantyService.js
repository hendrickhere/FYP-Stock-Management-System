const { ProductNotFoundException } = require("../errors/notFoundException");
const {ValidationException} = require("../errors/validationError");
const {DatabaseOperationException} = require("../errors/operationError");
const db = require("../models");
const { Warranty, Product, User, WarrantyClaim } = db;
const { Op } = require('sequelize');

class WarrantyService {

  async createWarranty(warrantyData) {
    const transaction = await db.sequelize.transaction();
    
    try {
      console.log('Creating warranty with data:', warrantyData);
      
      // Check if product exists
      const product = await Product.findByPk(warrantyData.product_id);
      if (!product) {
        throw new ProductNotFoundException("Product not found");
      }

      const createData = {
        product_id: warrantyData.product_id,
        organization_id: warrantyData.organization_id,
        warranty_type: warrantyData.warranty_type,
        warranty_number: warrantyData.warranty_number,
        terms: warrantyData.terms,
        description: warrantyData.description,
        duration: warrantyData.duration,
        created_by: warrantyData.created_by,
        created_at: new Date(),
        updated_at: new Date(),
      };

      console.log('Attempting to create warranty with:', createData);

      const warranty = await Warranty.create(createData, {
        transaction,
        include: [{ model: Product, as: "product" }],
  });

      console.log('Created warranty:', warranty.toJSON());

      await transaction.commit();
      return warranty;
    } catch (error) {
      console.error('Error creating warranty:', error);
      await transaction.rollback();
      throw error;
    }
  }

  // async getAllWarranties(filters = {}) {
  //   try {
  //     const whereClause = {};

  //     if (filters.product_id) {
  //       whereClause.product_id = filters.product_id;
  //     }

  //     if (filters.warranty_type) {
  //       whereClause.warranty_type = filters.warranty_type;
  //     }

  //     if (filters.userId) {
  //       whereClause.created_by = filters.userId;
  //     }

  //     return await Warranty.findAll({
  //       where: whereClause,
  //       include: [
  //         {
  //           model: Product,
  //           as: "product",
  //         },
  //       ],
  //       order: [["created_at", "DESC"]],
  //     });
  //   } catch (error) {
  //     throw error;
  //   }
  // }

  async getAllWarranties(organizationId) {
    try {
      return await Warranty.findAll({
        where: {
          organization_id: organizationId,
        },
        include: [
          {
            model: Product,
            as: "product",
          },
          {
            model: User,
            as: "creator",
            attributes: ['username']
          },
          {
            model: User,
            as: "modifier",
            attributes: ['username']
          }
        ],
        attributes: {
          include: [
            'created_at',
            'updated_at',
            'warranty_id',
            'warranty_number',
            'duration',
            'terms',
            'description',
            'warranty_type'
          ]
        },
        order: [['created_at', 'DESC']]
      });
    } catch (error) {
      console.error('Error fetching warranties:', error);
      throw error;
    }
  }

  async getExpiringWarranties(days = 30, userId) {
    try {
      const currentDate = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      return await Warranty.findAll({
        where: {
          created_by: userId,
          end_date: {
            [Op.between]: [currentDate, futureDate],
          },
        },
        include: [
          {
            model: Product,
            as: "product",
          },
        ],
      });
    } catch (error) {
      throw error;
    }
  }

  async getWarrantyById(warrantyId) {
    try {
      return await Warranty.findByPk(warrantyId, {
        include: [
          {
            model: Product,
            as: "product",
          },
          {
            model: User,
            as: "creator",
            attributes: ['username']
          },
          {
            model: User,
            as: "modifier",
            attributes: ['username']
          }
        ],
      });
    } catch (error) {
      throw error;
    }
  }

  async getWarrantiesByProduct(productId) {
    try {
      const warranties = await Warranty.findAll({
        where: {
          product_id: productId,
        },
        include: [
          {
            model: Product,
            as: "product",
            attributes: ['product_name', 'product_id']
          }
        ],
        order: [["created_at", "DESC"]],
        attributes: [
          'warranty_id',
          'duration',
          'description',
          'terms',
          'warranty_type',
          'created_at',
          'consumer',
          'manufacturer'
        ]
      });
  
      return {
        consumer: warranties
          .filter(warranty => warranty.consumer)
          .map(warranty => ({
            warranty_id: warranty.warranty_id,
            duration: warranty.duration,
            description: warranty.description,
            terms: warranty.terms,
            created_at: warranty.created_at,
            product: {
              id: warranty.product?.product_id,
              name: warranty.product?.product_name
            }
          })),
        manufacturer: warranties
          .filter(warranty => warranty.manufacturer)
          .map(warranty => ({
            warranty_id: warranty.warranty_id,
            duration: warranty.duration,
            description: warranty.description,
            terms: warranty.terms,
            created_at: warranty.created_at,
            product: {
              id: warranty.product?.product_id,
              name: warranty.product?.product_name
            }
          }))
      };
    } catch (error) {
      throw error;
    }
  }

  async updateWarranty(warrantyId, updateData) {
    const transaction = await db.sequelize.transaction();
    
    try {
      // First, check if the warranty exists
      const warranty = await Warranty.findByPk(warrantyId, {
        include: [
          {
            model: Product,
            as: 'product'
          }
        ]
      });

      if (!warranty) {
        throw new Error("Warranty not found");
      }

      // Validate duration is a positive number
      if (updateData.duration) {
        const duration = parseInt(updateData.duration);
        if (isNaN(duration) || duration < 0) {
          throw new ValidationException("Duration must be a positive number");
        }
        updateData.duration = duration;
      }

      // Validate warranty number length
      if (updateData.warranty_number && updateData.warranty_number.length > 50) {
        throw new ValidationException("Warranty number cannot exceed 50 characters");
      }

      // Validate terms length
      if (updateData.terms && updateData.terms.length > 255) {
        throw new ValidationException("Terms cannot exceed 255 characters");
      }

      // Perform the update
      await warranty.update({
        warranty_number: updateData.warranty_number,
        duration: updateData.duration,
        terms: updateData.terms,
        description: updateData.description,
        last_modified_by: updateData.last_modified_by,
        updated_at: new Date()
      }, { transaction });

      await transaction.commit();

      const updatedWarranty = await Warranty.findByPk(warrantyId, {
        include: [
          {
            model: Product,
            as: 'product'
          },
          {
            model: User,
            as: 'creator',
            attributes: ['username']
          },
          {
            model: User,
            as: 'modifier',
            attributes: ['username']
          }
        ]
      });

      return updatedWarranty;

    } catch (error) {
      await transaction.rollback();
      
      throw error;
    }
  }

  async getWarrantyStatistics(userId) {
    try {
      const currentDate = new Date();
      const [active, expiring, total] = await Promise.all([
        // Active warranties count
        Warranty.count({
          where: {
            created_by: userId,
            start_date: { [Op.lte]: currentDate },
            end_date: { [Op.gte]: currentDate },
          },
        }),
        // Expiring in next 30 days count
        Warranty.count({
          where: {
            created_by: userId,
            end_date: {
              [Op.between]: [
                currentDate,
                new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000),
              ],
            },
          },
        }),
        // Total warranties count
        Warranty.count({
          where: {
            created_by: userId,
          },
        }),
      ]);

      return {
        active,
        expiring,
        total,
        activePercentage: ((active / total) * 100).toFixed(2),
        expiringPercentage: ((expiring / total) * 100).toFixed(2),
      };
    } catch (error) {
      throw error;
    }
  }

  async getProductWarrantyAvailability(productId) {
    try {
      if (!productId) {
        throw new ValidationException("Product ID is required");
      }

      const warranties = await Warranty.findAll({
        where: {
          product_id: productId,
        },
        attributes: ["warranty_type"],
        raw: true,
      });

      // Create a map of warranty types and their availability
      const warrantyStatus = {
        1: {
          // Consumer
          exists: false,
          available: true,
          message: "Can add consumer warranty",
        },
        2: {
          // Manufacturer
          exists: false,
          available: true,
          message: "Can add manufacturer warranty",
        },
      };

      // Check existing warranties
      warranties.forEach((warranty) => {
        if (warranty.warranty_type in warrantyStatus) {
          warrantyStatus[warranty.warranty_type].exists = true;
          warrantyStatus[warranty.warranty_type].available = false;
          warrantyStatus[warranty.warranty_type].message = `${
            warranty.warranty_type === 1 ? "Consumer" : "Manufacturer"
          } warranty already exists`;
        }
      });

      return {
        success: true,
        warrantyStatus,
      };
    } catch (err) {
      console.error("Error in getProductWarrantyAvailability:", err);
      if (err instanceof ValidationException) {
        throw err;
      }
      throw new DatabaseOperationException(
        "Failed to check warranty availability",
        err
      );
    }
  }

  async deleteWarranty(warrantyId) {
    const transaction = await db.sequelize.transaction();
    
    try {
      const warranty = await Warranty.findOne({
        where: {
          warranty_id: warrantyId
        },
        include: [
          {
            model: WarrantyClaim,
            as: 'claims',
            attributes: ['claim_id', 'claim_status'],
            where: {
              claim_status: {
                [Op.in]: [1, 2] // Pending or Approved claims
              }
            },
            required: false 
          }
        ],
        transaction
      });
  
      if (!warranty) {
        throw new Error("Warranty not found");
      }
  
      // Check for active claims
      if (warranty.claims && warranty.claims.length > 0) {
        throw new ValidationException("Cannot delete warranty with active claims");
      }
  
      // If no active claims, proceed with deletion
      const deleteResult = await warranty.destroy({ transaction });
  
      await transaction.commit();
      return deleteResult;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

// Export an instance of the service
module.exports = new WarrantyService();