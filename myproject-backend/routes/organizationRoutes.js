const express = require('express');
const router = express.Router();
const OrganizationController = require('../controller/organizationController');
const validateOrganizationRequest = require('../middleware/organizationValidationMiddleware'); 

router.get("/organization", validateOrganizationRequest.getOrganization, OrganizationController.getOrganization);
router.put("/organization", validateOrganizationRequest.updateOrganization, OrganizationController.updateOrganization);

module.exports = router; 