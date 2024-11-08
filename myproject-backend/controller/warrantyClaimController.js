const WarrantyClaimService = require("../service/warrantyClaimService");

exports.createClaim = async (req, res) => {
  try {
    const claimData = {
      warranty_id: req.body.warranty_id,
      customer_id: req.body.customer_id,
      resolution_details: req.body.resolution_details,
      claim_type: req.body.claim_type,
      priority: req.body.priority || 1, // default priority
      assigned_to: req.body.assigned_to,
      created_by: req.user.id
    };

    const result = await WarrantyClaimService.createClaim(claimData);
    res.status(200).json({
      message: "Warranty claim created successfully",
      claim: result
    });
  } catch (err) {
    console.error("Error creating warranty claim:", err);
    if (err.message === "Warranty not found" || err.message === "Warranty expired") {
      res.status(400).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
};

exports.updateClaimStatus = async (req, res) => {
  try {
    const { 
      claim_status, 
      resolution_details, 
      priority,
      assigned_to 
    } = req.body;
    const claimId = req.params.id;
    
    const updateData = {
      claim_status,
      resolution_details,
      priority,
      assigned_to,
      last_modified_by: req.user.id
    };
    
    const updatedClaim = await WarrantyClaimService.updateClaimStatus(
      claimId,
      updateData
    );
    
    res.status(200).json({
      message: "Claim status updated successfully",
      claim: updatedClaim
    });
  } catch (err) {
    console.error("Error updating claim status:", err);
    if (err.message === "Claim not found") {
      res.status(404).json({ message: err.message });
    } else {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
};

// Add method for reassigning claims
exports.reassignClaim = async (req, res) => {
  try {
    const claimId = req.params.id;
    const { assigned_to } = req.body;
    
    const updatedClaim = await WarrantyClaimService.reassignClaim(
      claimId,
      assigned_to,
      req.user.id // last_modified_by
    );
    
    res.status(200).json({
      message: "Claim reassigned successfully",
      claim: updatedClaim
    });
  } catch (err) {
    console.error("Error reassigning claim:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};