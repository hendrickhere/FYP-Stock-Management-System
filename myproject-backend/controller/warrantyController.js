const WarrantyService = require("../service/warrantyService");
const { TYPE, CLAIM_STATUS } = require("../models/warrantyConstants");

exports.createWarranty = async (req, res) => {
  try {
    const warrantyData = {
      product_id: req.body.product_id,
      organization_id: req.user.organization_id,
      warranty_type: req.body.warranty_type,
      start_date: req.body.start_date,
      end_date: req.body.end_date,
      terms: req.body.terms,
      warranty_number: req.body.warranty_number,
      description: req.body.description,
      notification_sent: false,
      created_by: req.user.id
    };

    const result = await WarrantyService.createWarranty(warrantyData);
    res.status(200).json({
      message: "Warranty created successfully",
      warranty: result
    });
  } catch (err) {
    console.error(`Error creating warranty by user ${req.user.username}:`, err);
    if (err.name === 'SequelizeValidationError') {
      res.status(400).json({ message: err.message });
    } else if (err.message === "Product not found") {
      res.status(404).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
};

exports.getWarranties = async (req, res) => {
  try {
    const { 
      product_id, 
      warranty_type, 
      status,
      days_to_expiry 
    } = req.query;

    // Pass user information to service
    let warranties;
    if (status === 'active') {
      warranties = await WarrantyService.getActiveWarranties(req.user.id);
    } else if (status === 'expiring') {
      warranties = await WarrantyService.getExpiringWarranties(days_to_expiry || 30, req.user.id);
    } else {
      warranties = await WarrantyService.getAllWarranties({
        product_id,
        warranty_type,
        userId: req.user.id
      });
    }

    res.status(200).json({
      warranties,
      message: "Warranties retrieved successfully"
    });
  } catch (err) {
    console.error(`Error fetching warranties for user ${req.user.username}:`, err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getWarrantyById = async (req, res) => {
  try {
    const warranty = await WarrantyService.getWarrantyById(req.params.id);
    if (!warranty) {
      return res.status(404).json({ message: "Warranty not found" });
    }
    res.status(200).json(warranty);
  } catch (err) {
    console.error(`Error fetching warranty by ID for user ${req.user.username}:`, err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getActiveWarranties = async (req, res) => {
  try {
    const warranties = await WarrantyService.getActiveWarranties(req.user.id);
    res.status(200).json({
      warranties,
      message: "Active warranties retrieved successfully"
    });
  } catch (err) {
    console.error(`Error fetching active warranties for user ${req.user.username}:`, err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getExpiringWarranties = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const warranties = await WarrantyService.getExpiringWarranties(days, req.user.id);
    res.status(200).json({
      warranties,
      message: "Expiring warranties retrieved successfully"
    });
  } catch (err) {
    console.error(`Error fetching expiring warranties for user ${req.user.username}:`, err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getWarrantiesByProduct = async (req, res) => {
  try {
    const warranties = await WarrantyService.getWarrantiesByProduct(req.params.productId);
    res.status(200).json({
      warranties,
      message: "Product warranties retrieved successfully"
    });
  } catch (err) {
    console.error(`Error fetching warranties for product for user ${req.user.username}:`, err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.updateWarranty = async (req, res) => {
  try {
    const warrantyId = req.params.id;
    const updateData = req.body;
    const updatedWarranty = await WarrantyService.updateWarranty(warrantyId, updateData);
    res.status(200).json({
      warranty: updatedWarranty,
      message: "Warranty updated successfully"
    });
  } catch (err) {
    console.error(`Error updating warranty for user ${req.user.username}:`, err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getWarrantyStatistics = async (req, res) => {
  try {
    const statistics = await WarrantyService.getWarrantyStatistics(req.user.id);
    res.status(200).json({
      statistics,
      message: "Warranty statistics retrieved successfully"
    });
  } catch (err) {
    console.error(`Error fetching warranty statistics for user ${req.user.username}:`, err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.updateNotificationStatus = async (req, res) => {
  try {
    const warrantyId = req.params.id;
    const notificationSent = req.body.notification_sent;
    
    const updatedWarranty = await WarrantyService.updateNotificationStatus(
      warrantyId, 
      notificationSent
    );
    
    res.status(200).json({
      warranty: updatedWarranty,
      message: "Notification status updated successfully"
    });
  } catch (err) {
    console.error(`Error updating notification status for user ${req.user.username}:`, err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};