const staffService = require('../service/staffService');

exports.getStaffs = async (req, res) => {

    console.log('getStaffs endpoint hit');
    console.log('Username from query:', req.query.username);
    try {
        const { username } = req.query;
        
        if (!username) {
            return res.status(400).json({ 
                success: false,
                message: "Username is required" 
            });
        }

        const staffs = await staffService.getAllStaff(username);

        return res.status(200).json({
            success: true,
            staffMembers: staffs,
            message: "Staff members retrieved successfully"
        });

    } catch (error) {
        console.error('Error in getStaffs:', error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to retrieve staff members"
        });
    }
};

exports.searchStaffs = async (req, res) => {
    try {
        const { username } = req.query;
        const searchParams = req.body;

        if (!username) {
            return res.status(400).json({
                success: false,
                message: "Username is required"
            });
        }

        const staffs = await staffService.searchStaff(username, searchParams);

        return res.status(200).json({
            success: true,
            staffMembers: staffs,
            message: "Staff search completed successfully"
        });

    } catch (error) {
        console.error('Error in searchStaffs:', error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to search staff members"
        });
    }
};

exports.getStaffCount = async (req, res) => {
    try {
        const { username } = req.query;

        if (!username) {
            return res.status(400).json({
                success: false,
                message: "Username is required"
            });
        }

        const count = await staffService.getStaffCount(username);

        return res.status(200).json({
            success: true,
            count: count,
            message: "Staff count retrieved successfully"
        });

    } catch (error) {
        console.error('Error in getStaffCount:', error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to get staff count"
        });
    }
};

exports.deleteStaff = async (req, res) => {
    try {
        const { username } = req.query;
        const staffId = parseInt(req.params.id);

        if (!username) {
            return res.status(400).json({
                success: false,
                message: "Username is required"
            });
        }

        if (!staffId || isNaN(staffId)) {
            return res.status(400).json({
                success: false,
                message: "Valid staff ID is required"
            });
        }

        // Get user role from JWT token
        const userRole = req.user.role;
        
        // Only allow admins to delete staff
        if (userRole !== 'Admin' && userRole !== 'Manager') {
            return res.status(403).json({
                success: false,
                message: "Unauthorized: Only admins can delete staff members"
            });
        }

        const result = await staffService.deleteStaff(username, staffId);

        return res.status(200).json({
            success: true,
            message: result.message
        });

    } catch (error) {
        console.error('Error in deleteStaff:', error);
        
        if (error.message.includes('Unauthorized')) {
            return res.status(403).json({
                success: false,
                message: error.message
            });
        }
        
        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to delete staff member"
        });
    }
};