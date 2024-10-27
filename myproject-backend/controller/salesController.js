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