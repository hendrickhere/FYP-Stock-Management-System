const express = require('express');
const router = express.Router();
const WarrantyController = require('../controller/warrantyController');
const WarrantyClaimController = require('../controller/warrantyClaimController');
const WarrantyNotificationController = require('../controller/warrantyNotificationController');

// Warranty routes
router.get("/warranties/active", WarrantyController.getActiveWarranties);
router.get("/warranties/expiring", WarrantyController.getExpiringWarranties);
router.get("/warranties/product/:productId", WarrantyController.getWarrantiesByProduct);
router.get("/warranties/statistics", WarrantyController.getWarrantyStatistics);
router.get("/warranties", WarrantyController.getWarranties);
router.get("/warranties/:id", WarrantyController.getWarrantyById);
router.post("/warranties/create", WarrantyController.createWarranty);
router.put("/warranties/:id", WarrantyController.updateWarranty);
router.get("/warranties/product/:productId", WarrantyController.getProductWarrantyAvailability);

// Warranty claim routes - using only available methods
router.post("/warranty-claims/create", WarrantyClaimController.createClaim);
router.put("/warranty-claims/:id/status", WarrantyClaimController.updateClaimStatus);
router.put("/warranty-claims/:id/reassign", WarrantyClaimController.reassignClaim);

// Warranty notification routes - using only available methods
router.get("/notifications/unread", WarrantyNotificationController.getUnreadNotifications);
router.get("/notifications/warranty/:warrantyId", WarrantyNotificationController.getNotificationsByWarranty);
router.post("/notifications", WarrantyNotificationController.createNotification);
router.put("/notifications/:id/read", WarrantyNotificationController.markAsRead);
router.delete("/notifications/:id", WarrantyNotificationController.deleteNotification);
router.get("/notifications/statistics", WarrantyNotificationController.getNotificationStatistics);

module.exports = router;