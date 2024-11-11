const {User, SalesOrder, SalesOrderInventory, Customer, Product} = require("../models");

// Add debug logging
console.log('Loaded models:', {
    User: !!User,
    SalesOrder: !!SalesOrder,
    SalesOrderInventory: !!SalesOrderInventory,
    Customer: !!Customer,
    Product: !!Product
});

async function getSalesOrderByUUID(salesOrderUUID) {
    const salesOrder = await SalesOrder.findOne({
        where: {
            sales_order_uuid: salesOrderUUID
        }
    });

    return salesOrder.dataValues; 
}

async function getUserByUsername(username) {
    const user = await User.findOne({
      where: {
        username: username,
      },
    });
    return user.dataValues;
}

exports.getSalesOrderTotal = async (username, salesOrderUUID) => {
    const user = await getUserByUsername(username);
    if(!user){
        throw new Error("User not found");
    }

    const salesOrder = await SalesOrder.findOne({
        where:{
            sales_order_uuid: salesOrderUUID,
            organization_id: user.organization_id
        }
    })
    
    if (!salesOrder){
        throw new Error(`No sales order found under user ${username}`)
    }

    const salesOrdersInventories = SalesOrderInventory.findAll(
        {where: {
            sales_order_id: salesOrder.sales_order_id
        }}
    );
    let total = 0;
    for (const salesOrder of salesOrdersInventories){
        total += salesOrder.price;
    }
    return total; 
}

exports.getAllSalesOrders = async (username) => {
    try {
        const user = await User.findOne({
            where: {
                username: username,
            }
        });

        if (!user) {
            throw new Error("User not found");
        }

        const salesOrders = await SalesOrder.findAll({
            where: {
                organization_id: user.organization_id
            },
            include: [
                {
                    model: Customer,
                    required: false,
                    attributes: ['customer_name', 'customer_designation', 'shipping_address']
                },
                {
                    model: SalesOrderInventory,
                    as: 'items',
                    attributes: ['quantity', 'price']
                }
            ],
            order: [['order_date_time', 'DESC']]
        });

        // Format the response to match frontend expectations
        return {
            salesOrders: salesOrders.map(order => ({
                sales_order_id: order.sales_order_id,
                sales_order_uuid: order.sales_order_uuid,
                order_date_time: order.order_date_time,
                expected_shipment_date: order.expected_shipment_date,
                customer: order.Customer || null,
                total_price: order.items ? 
                    order.items.reduce((sum, item) => 
                        sum + (item.quantity * item.price), 0) 
                    : 0,
                inventories: order.items || []
            }))
        };
    } catch (error) {
        console.error('Error in getAllSalesOrders service:', error);
        // Return empty array instead of throwing
        return { salesOrders: [] };
    }
};