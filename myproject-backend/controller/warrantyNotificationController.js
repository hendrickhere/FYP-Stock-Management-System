const WarrantyNotificationService = require('../service/warrantyNotificationService');

class WarrantyNotificationController {
  constructor() {
        // Bind all methods to this instance
        this.getNotifications = this.getNotifications.bind(this);
        this.getUnreadNotifications = this.getUnreadNotifications.bind(this);
        this.getNotificationsByWarranty = this.getNotificationsByWarranty.bind(this);
        this.markAsRead = this.markAsRead.bind(this);
        this.createNotification = this.createNotification.bind(this);
        this.deleteNotification = this.deleteNotification.bind(this);
        this.getNotificationStatistics = this.getNotificationStatistics.bind(this);
    }
    
    async getNotifications(req, res) {
        try {
            const notifications = await WarrantyNotificationService.getNotificationsByWarranty(
                req.query.warranty_id
            );
            res.status(200).json({
                success: true,
                notifications,
                message: "Notifications retrieved successfully"
            });
        } catch (err) {
            console.error(`Error fetching notifications for user ${req.user.username}:`, err);
            res.status(500).json({ 
                success: false, 
                message: "Error fetching notifications",
                error: err.message 
            });
        }
    }

    async getUnreadNotifications(req, res) {
        try {
            const notifications = await WarrantyNotificationService.getUnreadNotifications();
            res.status(200).json({
                success: true,
                notifications,
                message: "Unread notifications retrieved successfully"
            });
        } catch (err) {
            console.error(`Error fetching unread notifications for user ${req.user.username}:`, err);
            res.status(500).json({ 
                success: false, 
                message: "Error fetching unread notifications",
                error: err.message 
            });
        }
    }

    async getNotificationsByWarranty(req, res) {
        try {
            const notifications = await WarrantyNotificationService.getNotificationsByWarranty(
                req.params.warrantyId
            );
            res.status(200).json({
                success: true,
                notifications,
                message: "Warranty notifications retrieved successfully"
            });
        } catch (err) {
            console.error(`Error fetching warranty notifications for user ${req.user.username}:`, err);
            res.status(500).json({ 
                success: false, 
                message: "Error fetching warranty notifications",
                error: err.message 
            });
        }
    }

    async markAsRead(req, res) {
        try {
            const notification = await WarrantyNotificationService.markAsRead(
                req.params.id
            );
            res.status(200).json({
                success: true,
                notification,
                message: "Notification marked as read successfully"
            });
        } catch (err) {
            console.error(`Error marking notification as read for user ${req.user.username}:`, err);
            res.status(500).json({ 
                success: false, 
                message: "Error marking notification as read",
                error: err.message 
            });
        }
    }

    async createNotification(req, res) {
        try {
            const notificationData = {
                warranty_id: req.body.warranty_id,
                notification_type: req.body.notification_type
            };

            const notification = await WarrantyNotificationService.createNotification(
                notificationData
            );

            res.status(201).json({
                success: true,
                notification,
                message: "Notification created successfully"
            });
        } catch (err) {
            console.error(`Error creating notification for user ${req.user.username}:`, err);
            res.status(500).json({ 
                success: false, 
                message: "Error creating notification",
                error: err.message 
            });
        }
    }

    async deleteNotification(req, res) {
        try {
            await WarrantyNotificationService.deleteNotification(req.params.id);
            res.status(200).json({
                success: true,
                message: "Notification deleted successfully"
            });
        } catch (err) {
            console.error(`Error deleting notification for user ${req.user.username}:`, err);
            res.status(500).json({ 
                success: false, 
                message: "Error deleting notification",
                error: err.message 
            });
        }
    }

    async getNotificationStatistics(req, res) {
        try {
            const stats = await WarrantyNotificationService.getNotificationStatistics();
            res.status(200).json({
                success: true,
                statistics: stats,
                message: "Notification statistics retrieved successfully"
            });
        } catch (err) {
            console.error(`Error fetching notification statistics for user ${req.user.username}:`, err);
            res.status(500).json({ 
                success: false, 
                message: "Error fetching notification statistics",
                error: err.message 
            });
        }
    }
}

module.exports = new WarrantyNotificationController();