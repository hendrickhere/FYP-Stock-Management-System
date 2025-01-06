const OrganizationService = require("../service/organizationService");

exports.getOrganization = async (req, res) => {
    const { organizationId } = req.query;

    try {
        const organization = await OrganizationService.getOrganization(organizationId);
        
        if (!organization) {
            return res.status(404).json({
                error: "Organization not found"
            });
        }

        res.status(200).json({
            data: organization,
            message: "Organization retrieved successfully"
        });

    } catch (err) {
        console.error('Error retrieving organization:', err);
        res.status(500).json({
            error: "Internal server error occurred while retrieving organization"
        });
    }
};

exports.updateOrganization = async (req, res) => {
    const { organization_id , ...updateData } = req.body;

    try {
        const existingOrg = await OrganizationService.getOrganization(organization_id);
        
        if (!existingOrg) {
            return res.status(404).json({
                error: "Organization not found"
            });
        }

        const updatedOrganization = await OrganizationService.updateOrganization(
            organization_id, 
            updateData
        );

        res.status(200).json({
            data: updatedOrganization,
            message: "Organization updated successfully"
        });

    } catch (err) {
        console.error('Error updating organization:', err);
        
        if (err.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({
                error: "Organization with this email already exists"
            });
        }
        res.status(500).json({
            error: "Internal server error occurred while updating organization"
        });
    }
};