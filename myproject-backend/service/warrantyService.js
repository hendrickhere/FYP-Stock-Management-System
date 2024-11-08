const db = require("../models");
const { Warranty, Product } = db;
const { Op } = require('sequelize');

class WarrantyService {
  async createWarranty(warrantyData) {
    const transaction = await db.sequelize.transaction();
    
    try {
      // Check if product exists
      const product = await Product.findByPk(warrantyData.product_id);
      if (!product) {
        throw new Error("Product not found");
      }

      // Create warranty record with user information
      const warranty = await Warranty.create({
        ...warrantyData,
        created_at: new Date(),
        updated_at: new Date()
      }, { 
        transaction,
        include: [{
          model: Product,
          as: 'product'
        }]
      });

      await transaction.commit();
      return warranty;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getAllWarranties(filters = {}) {
    try {
      const whereClause = {};

      if (filters.product_id) {
        whereClause.product_id = filters.product_id;
      }

      if (filters.warranty_type) {
        whereClause.warranty_type = filters.warranty_type;
      }

      if (filters.userId) {
        whereClause.created_by = filters.userId;
      }

      return await Warranty.findAll({
        where: whereClause,
        include: [{
          model: Product,
          as: 'product'
        }],
        order: [['created_at', 'DESC']]
      });
    } catch (error) {
      throw error;
    }
  }

  async getActiveWarranties(userId) {
    try {
      const currentDate = new Date();
      return await Warranty.findAll({
        where: {
          created_by: userId,
          start_date: { [Op.lte]: currentDate },
          end_date: { [Op.gte]: currentDate }
        },
        include: [{
          model: Product,
          as: 'product'
        }]
      });
    } catch (error) {
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
            [Op.between]: [currentDate, futureDate]
          }
        },
        include: [{
          model: Product,
          as: 'product'
        }]
      });
    } catch (error) {
      throw error;
    }
  }

  async getWarrantyById(warrantyId) {
    try {
      return await Warranty.findByPk(warrantyId, {
        include: [{
          model: Product,
          as: 'product'
        }]
      });
    } catch (error) {
      throw error;
    }
  }

  async getWarrantiesByProduct(productId) {
    try {
      return await Warranty.findAll({
        where: {
          product_id: productId
        },
        include: [{
          model: Product,
          as: 'product'
        }],
        order: [['created_at', 'DESC']]
      });
    } catch (error) {
      throw error;
    }
  }

  async updateWarranty(warrantyId, updateData) {
    const transaction = await db.sequelize.transaction();
    try {
      const warranty = await Warranty.findByPk(warrantyId);
      if (!warranty) {
        throw new Error('Warranty not found');
      }

      await warranty.update({
        ...updateData,
        updated_at: new Date()
      }, { transaction });

      await transaction.commit();
      return warranty;
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
            end_date: { [Op.gte]: currentDate }
          }
        }),
        // Expiring in next 30 days count
        Warranty.count({
          where: {
            created_by: userId,
            end_date: {
              [Op.between]: [
                currentDate,
                new Date(currentDate.getTime() + (30 * 24 * 60 * 60 * 1000))
              ]
            }
          }
        }),
        // Total warranties count
        Warranty.count({
          where: {
            created_by: userId
          }
        })
      ]);

      return {
        active,
        expiring,
        total,
        activePercentage: ((active / total) * 100).toFixed(2),
        expiringPercentage: ((expiring / total) * 100).toFixed(2)
      };
    } catch (error) {
      throw error;
    }
  }
}

// Export an instance of the service
module.exports = new WarrantyService();