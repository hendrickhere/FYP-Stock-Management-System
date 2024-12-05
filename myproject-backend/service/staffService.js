const { User, Organization } = require("../models");
const { Op } = require("sequelize");

class StaffService {
    async getAllStaff(username) {
        try {
            // First get the requesting user's organization
            const requestingUser = await User.findOne({
                where: { username },
                attributes: ['organization_id']
            });

            if (!requestingUser) {
                throw new Error('Requesting user not found');
            }

            // Get all users with role 'Staff' from the same organization
            const staffMembers = await User.findAll({
                where: {
                    organization_id: requestingUser.organization_id,
                    role: 'Staff'
                },
                include: [{
                    model: Organization,
                    as: 'organization',
                    attributes: ['organization_name']
                }],
                attributes: [
                    'user_id',
                    'username',
                    'email',
                    'role',
                    'created_at'
                ]
            });

            return staffMembers;
        } catch (error) {
            console.error('Error in getAllStaff:', error);
            throw error;
        }
    }

    async searchStaff(username, searchParams) {
        try {
            const requestingUser = await User.findOne({
                where: { username },
                attributes: ['organization_id']
            });

            if (!requestingUser) {
                throw new Error('Requesting user not found');
            }

            // Build search conditions
            const searchConditions = {
                organization_id: requestingUser.organization_id,
                role: 'Staff'
            };

            if (searchParams.term) {
                searchConditions[Op.or] = [
                    { username: { [Op.iLike]: `%${searchParams.term}%` } },
                    { email: { [Op.iLike]: `%${searchParams.term}%` } }
                ];
            }

            const staffMembers = await User.findAll({
                where: searchConditions,
                include: [{
                    model: Organization,
                    as: 'organization',
                    attributes: ['organization_name']
                }],
                attributes: [
                    'user_id',
                    'username',
                    'email',
                    'role',
                    'created_at'
                ]
            });

            return staffMembers;
        } catch (error) {
            console.error('Error in searchStaff:', error);
            throw error;
        }
    }

    async getStaffCount(username) {
        try {
            const requestingUser = await User.findOne({
                where: { username },
                attributes: ['organization_id']
            });

            if (!requestingUser) {
                throw new Error('Requesting user not found');
            }

            const count = await User.count({
                where: {
                    organization_id: requestingUser.organization_id,
                    role: 'Staff'
                }
            });

            return count;
        } catch (error) {
            console.error('Error in getStaffCount:', error);
            throw error;
        }
    }

        async deleteStaff(username, staffId) {
        try {
            // First get the requesting user's organization and role
            const requestingUser = await User.findOne({
                where: { username },
                attributes: ['organization_id', 'role']
            });

            if (!requestingUser) {
                throw new Error('Requesting user not found');
            }

            // Find the staff member to delete
            const staffMember = await User.findOne({
                where: {
                    user_id: staffId,
                    organization_id: requestingUser.organization_id,
                    role: 'Staff'
                }
            });

            if (!staffMember) {
                throw new Error('Staff member not found or unauthorized to delete');
            }

            // Check for any dependencies before deletion
            // Might want to add checks for related records like:
            // - Appointments assigned to this staff
            // - Sales orders created by this staff
            // - Products managed by this staff
            // Add these checks based on your business requirements

            // Perform the deletion
            const deletedCount = await User.destroy({
                where: {
                    user_id: staffId,
                    organization_id: requestingUser.organization_id,
                    role: 'Staff'
                }
            });

            if (deletedCount === 0) {
                throw new Error('Failed to delete staff member');
            }

            return {
                success: true,
                message: 'Staff member deleted successfully'
            };
        } catch (error) {
            console.error('Error in deleteStaff:', error);
            throw error;
        }
    }
}

module.exports = new StaffService();