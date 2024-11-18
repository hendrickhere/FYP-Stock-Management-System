const SalesService = require('../service/salesService');

exports.getAllSalesOrders = async (req, res) => {
    try {
        console.log('Received request params:', req.params);
        console.log('Username from params:', req.params.username);
        const username = req.params.username;
        
        if (!username) {
            return res.status(400).json({ message: 'Username is required' });
        }

        const salesOrders = await SalesService.getAllSalesOrders(username);
        
        if (!salesOrders) {
            return res.status(404).json({ message: 'No sales orders found' });
        }
        
        res.status(200).json({ salesOrders: salesOrders }); 
    } catch (err) {
        console.error('Error in getAllSalesOrders:', err);
        res.status(500).json({ message: err.message }); // Changed from 404 to 500 for server errors
    }
};

exports.getSalesOrderTotal = async (req, res) => {
    try {
        const username = req.params.username; // Changed from req.body to req.params
        const salesOrderUUID = req.params.salesOrderUUID; // Changed from res.params to req.params
        
        if (!username || !salesOrderUUID) {
            return res.status(400).json({ message: 'Username and salesOrderUUID are required' });
        }

        const total = await SalesService.getSalesOrderTotal(username, salesOrderUUID); // Added await
        res.status(200).json({ total: total }); // Changed from send to json
    } catch (err) {
        console.error('Error getting sales order total:', err);
        res.status(500).json({ message: err.message });
    }
};

exports.createSalesOrder = async (req, res) => {
    try {
        const username = req.params.username;
        const salesData = req.body;

        console.log('Received sales order data:', salesData);
        
        const result = await SalesService.createSalesOrder(username, salesData);
        
        res.status(201).json({
            success: true,
            message: 'Sales order created successfully',
            data: result
        });
    } catch (error) {
        console.error('Error creating sales order:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create sales order'
        });
    }
};

exports.updateSalesOrder = async (req, res) => {
    try {
        const { username, salesOrderUUID } = req.params;
        const { updatedData, managerPassword } = req.body;
        
        if (!username || !salesOrderUUID) {
            return res.status(400).json({ message: 'Username and salesOrderUUID are required' });
        }

        const result = await SalesService.updateSalesOrder(username, salesOrderUUID, updatedData, managerPassword);
        
        res.status(200).json({
            success: true,
            message: 'Sales order updated successfully',
            data: result
        });
    } catch (error) {
        console.error('Error updating sales order:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update sales order'
        });
    }
};

exports.deleteSalesOrder = async (req, res) => {
    try {
        const { username, salesOrderUUID } = req.params;
        const { managerPassword } = req.body;
        
        if (!username || !salesOrderUUID) {
            return res.status(400).json({ message: 'Username and salesOrderUUID are required' });
        }

        await SalesService.deleteSalesOrder(username, salesOrderUUID, managerPassword);
        
        res.status(200).json({
            success: true,
            message: 'Sales order deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting sales order:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete sales order'
        });
    }
};