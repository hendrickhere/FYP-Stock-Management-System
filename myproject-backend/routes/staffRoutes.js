const express = require('express');
const router = express.Router();
const StaffController = require('../controller/staffController');
const authMiddleware = require('../backend-middleware/authMiddleware');

// Apply authMiddleware to all routes
router.use(authMiddleware);

router.get('/staffs', StaffController.getStaffs);
router.post('/staffs/search', StaffController.searchStaffs);
router.get('/staffs/count', StaffController.getStaffCount);
router.delete('/staffs/:id', StaffController.deleteStaff);

module.exports = router;

