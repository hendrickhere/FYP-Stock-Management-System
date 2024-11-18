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
            where: { username }
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
                    required: true,
                    attributes: [
                        'customer_uuid',
                        'customer_name',
                        'customer_contact',
                        'customer_designation',
                        'customer_company',
                        'shipping_address'
                    ]
                },
                {
                    model: Product,
                    through: {
                        model: SalesOrderInventory,
                        as: 'sales_order_items',  // Match your association alias
                        attributes: ['quantity', 'price']
                    },
                    attributes: [
                        'product_id',  // Include this
                        'product_uuid',
                        'product_name',
                        'sku_number',
                        'product_description'
                    ]
                }
            ],
            order: [['order_date_time', 'DESC']]
        });

        // Debug log
        console.log('Raw sales orders:', JSON.stringify(salesOrders[0]?.get({ plain: true }), null, 2));

        const result = {
            salesOrders: salesOrders.map(order => {
                const plainOrder = order.get({ plain: true });
                return {
                    ...plainOrder,
                    Customer: {
                        ...plainOrder.Customer,
                        customer_contact: plainOrder.Customer?.customer_contact || 'N/A'
                    },
                    // Transform Products to match frontend expectations
                    products: plainOrder.Products?.map(product => ({
                        product_id: product.product_id,
                        product_uuid: product.product_uuid,
                        product_name: product.product_name,
                        sku_number: product.sku_number,
                        product_description: product.product_description,
                        sales_order_items: {
                            quantity: product.SalesOrderInventory?.quantity || 0,
                            price: product.SalesOrderInventory?.price || 0
                        }
                    })) || []
                };
            })
        };

        // Debug log
        console.log('Transformed result:', JSON.stringify(result.salesOrders[0], null, 2));

        return result;
    } catch (error) {
        console.error('Error in getAllSalesOrders service:', error);
        throw error;
    }
};

exports.createSalesOrder = async (username, salesData) => {
    try {
        const user = await User.findOne({
            where: { username }
        });

        if (!user) {
            throw new Error("User not found");
        }

        // First get customer by UUID to get the customer_id
        const customer = await Customer.findOne({
            where: { customer_uuid: salesData.customerUUID }
        });

        if (!customer) {
            throw new Error("Customer not found");
        }

        // Prepare the sales order data with the correct customer_id
        const salesOrderData = {
            order_date_time: new Date(), // Use current timestamp
            expected_shipment_date: salesData.expectedShipmentDate,
            payment_terms: salesData.paymentTerms,
            delivery_method: salesData.deliveryMethod,
            status_id: 1,
            customer_id: customer.customer_id, 
            user_id: user.user_id,
            organization_id: user.organization_id
        };

        console.log('Creating sales order with data:', salesOrderData);

        // Create the sales order
        const salesOrder = await SalesOrder.create(salesOrderData);

        // Create sales order items
        if (salesData.itemsList && salesData.itemsList.length > 0) {
            const orderItems = salesData.itemsList.map(item => ({
                sales_order_id: salesOrder.sales_order_id,
                product_id: item.uuid,
                quantity: item.quantity,
                price: item.price,
                status_id: 1
            }));

            await SalesOrderInventory.bulkCreate(orderItems);
        }

        return salesOrder;
    } catch (error) {
        console.error('Error in createSalesOrder:', error);
        throw error;
    }
};

exports.updateSalesOrder = async (username, salesOrderUUID, updatedData, managerPassword) => {
    try {
        const user = await User.findOne({
            where: { username }
        });

        if (!user) {
            throw new Error("User not found");
        }

        // Verify manager password if trying to update sensitive fields
        if (updatedData.payment_terms) {
            const manager = await User.findOne({
                where: { 
                    username,
                    role: 'Manager',
                    password_hash: managerPassword // You should use proper password hashing
                }
            });

            if (!manager) {
                throw new Error("Manager verification failed");
            }
        }

        const salesOrder = await SalesOrder.findOne({
            where: {
                sales_order_uuid: salesOrderUUID,
                organization_id: user.organization_id
            }
        });

        if (!salesOrder) {
            throw new Error("Sales order not found");
        }

        // Update the sales order
        await salesOrder.update(updatedData);

        // If there are updated products, handle them
        if (updatedData.products) {
            for (const product of updatedData.products) {
                await SalesOrderInventory.update(
                    {
                        quantity: product.sales_order_items.quantity,
                        price: product.sales_order_items.price
                    },
                    {
                        where: {
                            sales_order_id: salesOrder.sales_order_id,
                            product_id: product.product_id
                        }
                    }
                );
            }
        }

        return await SalesOrder.findOne({
            where: { sales_order_uuid: salesOrderUUID },
            include: [
                {
                    model: Customer,
                    attributes: ['customer_name', 'customer_designation', 'customer_email', 
                               'customer_contact', 'customer_company', 'shipping_address']
                },
                {
                    model: Product,
                    through: {
                        model: SalesOrderInventory,
                        attributes: ['quantity', 'price']
                    }
                }
            ]
        });
    } catch (error) {
        console.error('Error in updateSalesOrder:', error);
        throw error;
    }
};

exports.deleteSalesOrder = async (username, salesOrderUUID, managerPassword) => {
    try {
        const user = await User.findOne({
            where: { 
                username,
                role: 'Manager',
                password_hash: managerPassword // You should use proper password hashing
            }
        });

        if (!user) {
            throw new Error("Manager verification failed");
        }

        const salesOrder = await SalesOrder.findOne({
            where: {
                sales_order_uuid: salesOrderUUID,
                organization_id: user.organization_id
            }
        });

        if (!salesOrder) {
            throw new Error("Sales order not found");
        }

        // Delete associated inventory records first
        await SalesOrderInventory.destroy({
            where: { sales_order_id: salesOrder.sales_order_id }
        });

        // Delete the sales order
        await salesOrder.destroy();

        return true;
    } catch (error) {
        console.error('Error in deleteSalesOrder:', error);
        throw error;
    }
};


