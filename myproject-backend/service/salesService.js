const {User, SalesOrder, SalesOrderInventory} = require("../models/association");


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