const PurchaseService = require("../service/purchaseService");

exports.getAllPurchase = async (req, res) => {
  const pageNumber = req.query.pageNumber || 1;
  const pageSize = req.query.pageSize || 10;
  const username = req.params.username;

  try {
    const result = await PurchaseService.getAllPurchases(username, pageNumber, pageSize);
    if(result === null){
      return res.status(404).json({ message: "No purchase orders found" });
    }
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.insertPurchase = async (req, res) => {
  try {
    const result = await PurchaseService.insertPurchase({
      ...req.body,
      orderStatus: 'pending'
    });

    res.status(200).json({
      success: true,
      purchaseOrder: result,
      message: "Purchase Order inserted successfully"
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

exports.createPurchaseOrder = async (req, res) => {
  try {
    const purchaseData = {
      username: req.params.username,
      ...req.body
    };

    const result = await PurchaseService.createPurchaseOrder(purchaseData);
    res.status(200).json({
      success: true,
      message: "Purchase order created successfully",
      data: result
    });
  } catch (error) {
    console.error("Error creating purchase order:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error creating purchase order"
    });
  }
};

exports.updatePurchaseOrder = async (req, res) => {
  try {
    const { username, purchaseOrderId } = req.params;
    const { updatedData, managerPassword } = req.body;

    const result = await PurchaseService.handleUpdateOrder(
      purchaseOrderId,
      username,
      updatedData,
      managerPassword
    );

    res.status(200).json({
      success: true,
      data: result,
      message: "Purchase order updated successfully"
    });
  } catch (error) {
    console.error("Error updating purchase order:", error);
    
    // Special handling for invalid manager password
    if (error.message === "Invalid manager password") {
      return res.status(401).json({
        success: false,
        message: "Invalid manager password",
        code: "INVALID_MANAGER_PASSWORD"
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Failed to update purchase order"
    });
  }
};

exports.insertAutomatedPurchase = async (req, res) => {
  try {
    // Log the incoming data for debugging
    console.log('Received automated purchase order data:', JSON.stringify(req.body, null, 2));

    const result = await PurchaseService.insertAutomatedPurchase({
      ...req.body,
      username: req.params.username || req.body.username
    });

    res.status(200).json({
      success: true,
      purchaseOrder: result.purchaseOrder,
      message: result.message
    });
  } catch (err) {
    console.error('Automated purchase creation error:', err);
    
    // Enhanced error handling
    const errorResponse = {
      success: false,
      error: err.message,
      code: 'AUTOMATED_PURCHASE_ERROR'
    };

    // Add specific error handling for common cases
    if (err.message.includes('Generic vendor')) {
      errorResponse.code = 'GENERIC_VENDOR_ERROR';
    } else if (err.message.includes('Product not found')) {
      errorResponse.code = 'PRODUCT_NOT_FOUND';
    }

    res.status(500).json(errorResponse);
  }
};

exports.updatePurchaseStatus = async (req, res) => {
  const { purchaseOrderId } = req.params;
  const { status, username } = req.body;

  try {
    let result;
    switch (status) {
      case 'delivered':
        result = await PurchaseService.markPurchaseOrderAsDelivered(purchaseOrderId, username);
        break;
      case 'cancelled':
        result = await PurchaseService.cancelPurchaseOrder(purchaseOrderId, username);
        break;
      default:
        throw new Error('Invalid status update requested');
    }

    res.status(200).json({
      success: true,
      purchaseOrder: result,
      message: `Purchase Order ${status} successfully`
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

exports.getPurchaseOrders = async (req, res) => {
  try {
    const { username } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    const result = await PurchaseService.getPurchaseOrders(username, status, parseInt(page), parseInt(limit));
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching purchase orders"
    });
  }
};

exports.markAsDelivered = async (req, res) => {
  try {
    const { username } = req.params;
    const { purchaseOrderId } = req.body;

    const result = await PurchaseService.markPurchaseOrderAsDelivered(purchaseOrderId, username);
    res.status(200).json({
      success: true,
      message: "Purchase order marked as delivered",
      data: result
    });
  } catch (error) {
    console.error("Error marking purchase order as delivered:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error updating purchase order status"
    });
  }
};

exports.insertDeliveredPurchase = async (req, res) => {
  try {
    const result = await PurchaseService.insertPurchase({
      ...req.body,
      orderStatus: 'delivered'
    });

    res.status(200).json({
      success: true,
      purchaseOrder: result,
      message: "Purchase Order created and inventory updated successfully"
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

exports.cancelPurchaseOrder = async (req, res) => {
  try {
    const { username } = req.params;
    const { purchaseOrderId } = req.body;

    const result = await PurchaseService.cancelPurchaseOrder(purchaseOrderId, username);
    res.status(200).json({
      success: true,
      message: "Purchase order cancelled successfully",
      data: result
    });
  } catch (error) {
    console.error("Error cancelling purchase order:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error cancelling purchase order"
    });
  }
};

exports.getPurchaseDetails = async (req, res) => {
  const { purchaseOrderId } = req.params;
  const { username } = req.query;

  try {
    const result = await PurchaseService.getPurchaseOrderDetails(purchaseOrderId, username);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

exports.deletePurchaseOrder = async (req, res) => {
  try {
    const { username, purchaseOrderId } = req.params;
    const { managerPassword } = req.body;

    if (!managerPassword) {
      return res.status(400).json({
        success: false,
        message: "Manager password is required",
        code: "PASSWORD_REQUIRED"
      });
    }

    const result = await PurchaseService.deletePurchaseOrder(
      parseInt(purchaseOrderId),
      username,
      managerPassword
    );

    res.status(200).json({
      success: true,
      message: result.message,
      inventoryReverted: result.inventoryReverted,
      revertedQuantities: result.revertedQuantities
    });
  } catch (error) {
    console.error("Error deleting purchase order:", error);
    
    // Special handling for invalid manager password
    if (error.message === "Invalid manager password") {
      return res.status(401).json({
        success: false,
        message: "Invalid manager password",
        code: "INVALID_MANAGER_PASSWORD"
      });
    }

    // Handle other specific errors
    if (error.message === "Purchase order not found") {
      return res.status(404).json({
        success: false,
        message: "Purchase order not found",
        code: "ORDER_NOT_FOUND"
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Error deleting purchase order",
      code: "DELETE_ERROR"
    });
  }
};
