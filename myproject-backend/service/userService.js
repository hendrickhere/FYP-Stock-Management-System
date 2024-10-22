const bcrypt = require("bcryptjs");
const sequelize = require("../db-config");
const jwt = require("jsonwebtoken");

const {Customer, User, SalesOrder, Inventory, Organization, SalesOrderInventory} = require("../models/association");

async function getUserByUsername(username) {
  const user = await User.findOne({
    where: {
      username: username,
    },
  });
  return user.dataValues;
}

async function getUserById(userId) {
  try {
    const user = await User.findOne({
      where: {
        user_id: userId,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }
    
    return user.dataValues;
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    throw error;
  }
}

async function getCustomerByUUID(uuid){
  const customer = await Customer.findOne({
    where: {
      customer_uuid: uuid,
    }
  })
  return customer.dataValues;
}

async function getInventoryByUUID(uuid) {
  const inventory = await Inventory.findOne({
    where: {
      status_id: 1, 
      product_uuid: uuid,
    }
  }); 
  return inventory; 
}

exports.signup = async (userData) => {
  const { username, email, password, role, created_at } = userData;

  const userExists = await User.findOne({
    where: {
      email: email,
    },
  });
  if (userExists) {
    throw new Error("User already exists");
  } else {
    if (!password) {
      throw new Error("Password is required");
    }
    const password_hash = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      email,
      password_hash,
      role,
      created_at,
      organization_id: 1,
    });
    console.log(newUser);
    if (!newUser) {
      throw new Error("Failed to create user, please try again later");
    }
    return newUser.dataValues;
  }
};

exports.login = async (loginData) => {
  const { email, password } = loginData;

  const result = await User.findOne({
    where: {
      email: email,
    },
  });
  if (result) {
    console.log(result.dataValues);
    const user = result.dataValues;
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (isValid) {
      const token = jwt.sign(
        { id: user.user_id, username: user.username },
        'secretkey123', // Secret key for JWT - make sure this matches authMiddleware
        { expiresIn: '1h' } // Token validity
      );

      return { message: 'Login successful', token, user: { username: user.username } };
    } else {
      throw new Error("Invalid Credentials");
    }
  } else {
    throw new Error("User not found");
  }
};

exports.verifyUser = async (email, password) => {
  try {
    console.log("Verifying user with email:", email);
    // Find user by email
    const result = await User.findOne({
      where: {
        email: email,
      },
    });

    if (!result) {
      console.log("User not found with email:", email);
      return null;
    }

    const user = result.dataValues;

    // Verify the password using bcrypt
    console.log("Comparing passwords...");
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      console.log("Invalid password for user:", email);
      return null;
    }

    console.log("User verified successfully:", email);
    return user;
  } catch (error) {
    console.error("Error verifying user:", error);
    throw new Error("Error during user verification");
  }
};


exports.addCustomer = async (customerData, username) => {
  const {
    customerName,
    customerEmail,
    customerDesignation,
    customerContact,
    customerCompany,
    billingAddress,
    shippingAddress,
    createdAt,
  } = customerData;

  const user = await User.findOne({
    where: {
      username: username,
    },
  });

  if (user) {
    const customer = await Customer.create({
      customer_name: customerName,
      customer_email: customerEmail,
      customer_designation: customerDesignation,
      customer_contact: customerContact,
      customer_company: customerCompany,
      billing_address: billingAddress,
      shipping_address: shippingAddress,
      created_at: createdAt,
      user_id: user.dataValues.user_id,
    });
    if (!customer) {
      throw new Error("Failed to create customer, please try again later.");
    }
    return customer.dataValues;
  } else {
    throw new Error("User does not exist");
  }
};

exports.getAllCustomers = async (username) => {
  const user = await getUserByUsername(username);
  if (user) {
    const customers = await Customer.findAll({
      where: {
        user_id: user.user_id,
      },
    });

    if (!customers) {
      throw new Error("No customers found.");
    }
    return customers;
  } else {
    throw new Error("User does not exist.");
  }
};

exports.getCustomer = async (customerUuid, username) => {
  const user = await getUserByUsername(username);

  if (user) {
    const customer = await Customer.findOne({
      where: {
        user_id: user.user_id,
        customer_uuid: customerUuid,
      },
    });

    if (!customer) {
      throw new Error("Error retrieving customer details.");
    }
    return customer;
  } else {
    throw new Error("User does not exist.");
  }
};

exports.addInventory = async (username, inventoryData) => {
  const user = await getUserByUsername(username);
  const {
    inventoryName,
    inventoryStock,
    skuNumber,
    unit,
    brand,
    dimensions,
    dimensionsUnit,
    manufacturer,
    weight,
    weightUnit,
    isExpiryGoods,
    expiryDate,
    price,
    description,
    images
  } = inventoryData;
  if (user) {
    const inventory = await Inventory.create({
      product_name: inventoryName,
      product_stock: inventoryStock,
      sku_number: skuNumber,
      unit: unit,
      brand: brand,
      dimensions: dimensions,
      dimensions_unit: dimensionsUnit, 
      manufacturer: manufacturer,
      weight: weight,
      weight_unit: weightUnit,
      is_expiry_goods: isExpiryGoods,
      expiry_date: expiryDate,
      user_id: user.user_id,
      organization_id: user.organization_id,
      status_id: 1,
      price: price,
      description: description,
      images: images, 
    });
    if (!inventory) {
      throw new Error("Failed to create inventory");
    }
    return inventory;
  } else {
    throw new Error("User not found");
  }
};

exports.updateInventory = async (username, inventoryUUID, updateData) => {
  const user = await getUserByUsername(username);
  const {
    inventoryName,
    inventoryStock,
    skuNumber,
    unit,
    brand,
    dimensions,
    manufacturer,
    weight,
    isExpiryGoods,
    expiryDate,
  } = updateData;
  const dbData = {
    product_name: inventoryName,
    product_stock: inventoryStock,
    sku_number: skuNumber,
    unit: unit,
    brand: brand,
    dimensions: dimensions,
    manufacturer: manufacturer,
    weight: weight,
    is_expiry_goods: isExpiryGoods,
    expiry_date: expiryDate,
    user_id: user.user_id,
    organization_id: user.organization_id,
    status_id: 1
  };
  if (user) {
    const updated = await Inventory.update(dbData, {
      where: {
        product_uuid: inventoryUUID,
        user_id: user.user_id,
      },
    });
    if (updated) {
      const updatedInventory = await Inventory.findOne({
        where: {
          product_uuid: inventoryUUID,
        },
      });
      return updatedInventory;
    } else {
      throw new Error("Inventory not found");
    }
  } else {
    throw new Error("User not found");
  }
};

exports.getAllInventory = async (username) => {
  const user = await getUserByUsername(username);
  if (!user) {
    throw new Error("User not found");
  };
  const inventories = await Inventory.findAll({
    where: {
      organization_id: user.organization_id, 
      status_id: 1,
    }
  }); 
  if(!inventories){
    throw new Error("No inventories found");
  }
  return inventories; 
}

exports.addSalesOrder = async (username, salesOrderData) => {
  const user = await getUserByUsername(username);
  if (!user) {
    throw new Error("User not found");
  }
  const {
    itemsList,
    orderDateTime,
    expectedShipmentDate,
    paymentTerms,
    deliveryMethod,
    customerUUID,
  } = salesOrderData;
  const transaction = await sequelize.transaction();
  try {
    const customer = await getCustomerByUUID(customerUUID);
    const salesOrder = await SalesOrder.create(
      {
        order_date_time: orderDateTime,
        expected_shipment_date: expectedShipmentDate,
        payment_terms: paymentTerms,
        delivery_method: deliveryMethod,
        customer_id: customer.customer_id,
        user_id: user.user_id,
        organization_id: user.organization_id,
        status_id: 1,
      },
      { transaction }
    );

    if(!salesOrder){
      throw new Error("Failed to create Sales Order");
    }

    for (const item of itemsList) {
      const itemObj = await getInventoryByUUID(item.uuid);
      
      if(!itemObj){
        throw new Error(`Inventory item not found for UUID: ${item.uuid}`);
      }

      const price = itemObj.price * item.quantity;
      await SalesOrderInventory.create(
        {
          sales_order_id: salesOrder.sales_order_id,
          product_id: itemObj.product_id,
          quantity: item.quantity,
          status_id: 1,
          price: price
        },
        { transaction }
      );

      const leftoverStock = itemObj.product_stock - item.quantity;
      if(leftoverStock < 0){
        throw new Error("Unable to create sales order due to low stock volume, please try again after stock volume is increased.")
      }
      await Inventory.update(
        { product_stock: leftoverStock },
        {
          where: {
            product_id: itemObj.product_id,
          },
          transaction,
        }
      );
    }
    await transaction.commit();
    return salesOrder;
  } catch (err) {
    await transaction.rollback();
    throw new Error(err.message);
  }
};

exports.getSalesOrder = async (username) => {
  const user = await getUserByUsername(username);
  if (!user) {
    throw new Error("User not found");
  }

  const salesOrders = await SalesOrder.findAll({
    where: { organization_id: user.organization_id },
    include: [
      {
        model: Inventory,
        through: {
          model: SalesOrderInventory,
          attributes: ["quantity", "price"],
        },
      },
      {
        model: Customer,
        attributes: [
          "customer_uuid",
          "customer_name",
          "customer_designation",
          "customer_company",
          "shipping_address",
        ],
      },
    ],
  });
  const totalPricePromises = salesOrders.map(async (order) => {
    const total = await SalesOrderInventory.findOne({
    where: { sales_order_id: order.sales_order_id },
      attributes: [[sequelize.literal('SUM(price * quantity)'), 'total_price']],
      raw: true
    });
    return { sales_order_id: order.sales_order_id, total_price: total.total_price };
  });
  
  const totalPrices = await Promise.all(totalPricePromises);

  const salesOrdersWithTotalPrice = salesOrders.map(order => {
    const totalPrice = totalPrices.find(tp => tp.sales_order_id === order.sales_order_id).total_price;
    return {
      ...order.toJSON(),
      total_price: totalPrice
    };
  });

  
  if(!salesOrdersWithTotalPrice){
    throw new Error("Sales Orders not found.");
  }
  return salesOrdersWithTotalPrice; 

}

exports.deleteInventory = async (username, inventoryuuid) => {
  const user = await getUserByUsername(username);
  const itemObj = await getInventoryByUUID(inventoryuuid);
  const transaction = await sequelize.transaction();
  if(!user){
    throw new Error("User not found");
  }
  try{
    const inventory = await Inventory.update(
      {status_id: 0},
      {
        where : {
          product_id: itemObj.product_id,
          status_id: 1
        }, 
        transaction,
      }, 
    )
  
    if(!inventory){
      throw new Error("Inventory not found"); 
    } 
  
    const salesOrderInventory = await SalesOrderInventory.findAll({
      where: {product_id: itemObj.product_id},
      transaction,
    })
  
    for (const entry of salesOrderInventory) {
      await SalesOrderInventory.update(
        { status_id: 0 },
        {
          where: { product_id: entry.product_id, status_id: 1 },
          transaction,
        }
      );
    }
  
    if(!salesOrderInventory) {
      throw new Error("Sales Order Inventory not found");
    }
    transaction.commit();
    return inventory;
    
  } catch(err){
    transaction.rollback();
    throw new Error(err.message);
  }
}

exports.getInventory = async (username, inventoryUUID) => {
  const user = await getUserByUsername(username);

  if(user === null){
    throw new Error("User not found");
  } 
  const itemObj = await getInventoryByUUID(inventoryUUID);

  if(itemObj === null){
    throw new Error("Inventory not found");
  }
  return itemObj; 
}

exports.getUserById = getUserById;


