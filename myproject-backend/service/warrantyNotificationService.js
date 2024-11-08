const { WarrantyNotification, Warranty } = require("../models");
const { sequelize } = require("../models");  

class WarrantyNotificationService {
  async createNotification(notificationData) {
    const transaction = await sequelize.transaction();
    
    try {
      const notification = await WarrantyNotification.create({
        warranty_id: notificationData.warranty_id,
        notification_type: notificationData.notification_type,
        notification_date: new Date(),
        is_read: false
      }, { transaction });

      await transaction.commit();
      return notification;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async markAsRead(notificationId) {
    const transaction = await sequelize.transaction();
    
    try {
      const notification = await WarrantyNotification.findByPk(notificationId);
      if (!notification) {
        throw new Error("Notification not found");
      }

      await notification.update({
        is_read: true
      }, { transaction });

      await transaction.commit();
      return notification;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getNotificationsByWarranty(warrantyId) {
    try {
      return await WarrantyNotification.findAll({
        where: { warranty_id: warrantyId },
        order: [['notification_date', 'DESC']]
      });
    } catch (error) {
      throw error;
    }
  }

  async getUnreadNotifications() {
    try {
      return await WarrantyNotification.findAll({
        where: { is_read: false },
        include: [{
          model: Warranty,
          as: 'warranty'
        }],
        order: [['notification_date', 'DESC']]
      });
    } catch (error) {
      throw error;
    }
  }

  async getNotificationStatistics() {
        try {
            const stats = await WarrantyNotification.findAll({
                attributes: [
                    [sequelize.fn('COUNT', sequelize.col('notification_id')), 'total'],
                    [sequelize.fn('SUM', sequelize.literal('CASE WHEN is_read = false THEN 1 ELSE 0 END')), 'unread'],
                    [sequelize.fn('SUM', sequelize.literal('CASE WHEN is_read = true THEN 1 ELSE 0 END')), 'read']
                ]
            });

            return {
                total: parseInt(stats[0].getDataValue('total')),
                unread: parseInt(stats[0].getDataValue('unread')),
                read: parseInt(stats[0].getDataValue('read')),
            };
        } catch (error) {
            throw error;
        }
    }

    async deleteNotification(notificationId) {
        const transaction = await sequelize.transaction();
        try {
            const notification = await WarrantyNotification.findByPk(notificationId);
            if (!notification) {
                throw new Error("Notification not found");
            }

            await notification.destroy({ transaction });
            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
}

module.exports = new WarrantyNotificationService();