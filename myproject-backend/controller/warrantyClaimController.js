const WarrantyClaimService = require("../service/warrantyClaimService");
const { ProductUnitNotFoundException, WarrantyUnitNotFoundException, OrganizationNotFoundException } = require("../errors/notFoundException");
const {ExpiredWarrantyError} = require("../errors/warrantyError");

exports.createClaim = async (req, res) => {
  try {
  const requiredFields = ['product_unit_id', 'claim_type', 'product_id'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: 'Missing required fields',
        details: {
          missingFields
        }
      });
    }

    const claimData = {
      resolution_details: req.body.resolution_details,
      claim_type: req.body.claim_type,
      priority: req.body.priority || 1,
      assigned_to: req.body.assigned_to,
      created_by: req.body.created_by,
      product_unit_id: req.body.product_unit_id,
      product_id: req.body.product_id
    };

    const result = await WarrantyClaimService.createClaim(claimData);
    
    return res.status(201).json({
      status: 'success',
      message: 'Warranty claim created successfully',
      data: {
        claim: result
      }
    });

  } catch (error) {
    console.error('Error creating warranty claim:', {
      error: error.message,
      stack: error.stack,
      userId: req.user.id,
      claimData: req.body
    });

    if (error instanceof ProductUnitNotFoundException) {
      return res.status(404).json({
        status: 'error',
        code: error.code,
        message: error.message
      });
    }

    if (error instanceof WarrantyUnitNotFoundException) {
      return res.status(404).json({
        status: 'error',
        code: error.code,
        message: error.message
      });
    }

    if (error instanceof ExpiredWarrantyError) {
      return res.status(400).json({
        status: 'error',
        code: error.code,
        message: error.message,
        details: {
          warrantyEnd: error.warrantyEnd
        }
      });
    }

    // Handle unexpected errors
    return res.status(500).json({
      status: 'error',
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred while creating the warranty claim',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
};


exports.viewWarrantyClaim = async (req, res) => {
  const {organizationId, assignee, status, pageNumber, pageSize} = req.query; 

  try{
    const warrantyClaims = await WarrantyClaimService.getClaimsByOrganizationId(organizationId, assignee, status, pageNumber, pageSize);

    return res.status(200).json({data: warrantyClaims, message: "warranty claims retrieved successfully"});

  } catch(err){
    if (err instanceof OrganizationNotFoundException){
      return res.status(OrganizationNotFoundException.statusCode).json({message: err.message});
    }
    return res.status(500).json({
      status: 'error',
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred while creating the warranty claim',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
}

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