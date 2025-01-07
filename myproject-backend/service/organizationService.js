const { Op } = require("sequelize");  // Import Op instead of just 'or'
const { 
    Organization,
    sequelize 
  } = require("../models");
exports.getOrganization = async (organizationId) => {
    try {
        const organization = await Organization.findOne({
            where: {
                [Op.or]: [
                    { organization_id: organizationId },
                ]
            }
        });

        return organization;
        
    } catch (error) {
        console.error('Service error retrieving organization:', error);
        throw error;
    }
};

exports.updateOrganization = async (organizationId, updateData) => {
    try {
        const [updatedCount, updatedOrganizations] = await Organization.update(
            {
                ...updateData,
                updated_at: sequelize.fn('NOW')
            },
            {
                where: {
                    [Op.or]: [
                        { organization_id: organizationId },
                    ]
                },
                returning: true 
            }
        );

        return updatedOrganizations[0] || null;

    } catch (error) {
        console.error('Service error updating organization:', error);
        throw error;
    }
};