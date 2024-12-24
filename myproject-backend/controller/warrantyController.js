const WarrantyService = require("../service/warrantyService");
const { TYPE, CLAIM_STATUS } = require("../models/warrantyConstants");
const UserService = require("../service/userService");
const {ValidationException} = require("../errors/validationError");
const {DatabaseOperationException} = require("../errors/operationError");

exports.getProductWarrantyAvailability = async (req, res) => {
  const { productId } = req.params;
 
  try {
    // Validate productId
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required"
      });
    }
 
    const result = await WarrantyService.getProductWarrantyAvailability(productId);
 
    return res.status(200).json({
      success: true,
      ...result
    });
 
  } catch (err) {
    console.error('Error in getProductWarrantyAvailability:', err);
 
    if (err instanceof ValidationException) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
 
    if (err instanceof DatabaseOperationException) {
      return res.status(500).json({
        success: false,
        message: "Failed to check warranty availability"
      });
    }
 
    // Generic error handler
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
 };

exports.createWarranty = async (req, res) => {
  try {
    const username = req.body.username; 
    const user = await UserService.getUserByUsernameAsync(username);
    const warrantyData = {
      product_id: req.body.product_id,
      organization_id: req.body.organization_id,
      warranty_type: req.body.warranty_type,
      terms: req.body.terms,
      warranty_number: req.body.warranty_number,
      description: req.body.description,
      duration: req.body.duration, 
      created_by: user.user_id
    };

    const result = await WarrantyService.createWarranty(warrantyData);
    res.status(200).json({
      message: "Warranty created successfully",
      warranty: result
    });

    console.log('Warranty data received:', req.body);
    console.log('Processed warranty data:', warrantyData);
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

exports.getAllWarranties = async (req, res) => {
  try {
    const username = req.query.username; 
    const user = await UserService.getUserByUsernameAsync(username);
    const warranties = await WarrantyService.getAllWarranties(user.organization_id);
    
    console.log('Warranties retrieved:', warranties.map(w => ({
      id: w.warranty_id,
      created_at: w.created_at,
      updated_at: w.updated_at,
      creator: w.creator?.username,
      modifier: w.modifier?.username
    })));
    
    res.status(200).json({
      warranties,
      message: "Active warranties retrieved successfully"
    });
  } catch (err) {
    console.error(`Error fetching active warranties:`, err);
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
    const username = req.body.username;
    
    const user = await UserService.getUserByUsernameAsync(username);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const updateData = {
      warranty_number: req.body.warranty_number,
      duration: req.body.duration,
      terms: req.body.terms,
      description: req.body.description,
      last_modified_by: user.user_id 
    };

    if (!updateData.warranty_number || !updateData.duration) {
      return res.status(400).json({
        success: false,
        message: "Warranty number and duration are required fields"
      });
    }

    const updatedWarranty = await WarrantyService.updateWarranty(warrantyId, updateData);

    const warrantyWithProduct = await WarrantyService.getWarrantyById(warrantyId);

    res.status(200).json({
      success: true,
      message: "Warranty updated successfully",
      warranty: warrantyWithProduct
    });

  } catch (err) {
    console.error(`Error updating warranty:`, err);
    
    if (err.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: err.errors.map(e => ({ field: e.path, message: e.message }))
      });
    }

    if (err.message === "Warranty not found") {
      return res.status(404).json({
        success: false,
        message: err.message
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update warranty",
      error: err.message
    });
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

exports.deleteWarranty = async (req, res) => {
  try {
    const warrantyId = req.params.id;
    const username = req.query.username;
    
    // Get user details
    const user = await UserService.getUserByUsernameAsync(username);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    await WarrantyService.deleteWarranty(warrantyId);
    
    res.status(200).json({
      success: true,
      message: "Warranty deleted successfully"
    });
  } catch (err) {
    console.error(`Error deleting warranty:`, err);
    
    if (err instanceof ValidationException) {
      return res.status(409).json({
        success: false,
        message: err.message
      });
    }

    if (err.message === "Warranty not found") {
      return res.status(404).json({
        success: false,
        message: err.message
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete warranty",
      error: err.message
    });
  }
};