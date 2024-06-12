const SalesService = require('../service/salesService');

exports.getSalesOrderTotal = async (req, res) => {
    const {username} = req.body; 
    const salesOrderUUID = res.params.salesOrderUUID; 

    try{
        const total = SalesService.getSalesOrderTotal(username, salesOrderUUID);
        res.status(200).send({total: total});
    } catch (err){
        res.status(500).send({message: err.message});
    }
}