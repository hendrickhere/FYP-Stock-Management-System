const bcrypt = require("bcryptjs");
const { JWT_CONFIG } = require("../config/app.config");
const { Op, Sequelize } = require("sequelize");
const jwt = require("jsonwebtoken");
const db = require("../models"); 
console.log('Models available in userService:', Object.keys(db)); 
const sequelize = require("../config/db-config");  

const User = db.User;
const Customer = db.Customer;
const SalesOrder = db.SalesOrder;
const Product = db.Product;
const Organization = db.Organization;
const SalesOrderInventory = db.SalesOrderInventory;

console.log('User model:', !!User);
console.log('Customer model:', !!Customer);
console.log('SalesOrder model:', !!SalesOrder);
console.log('Product model:', !!Product);


exports.getUserByUsernameAsync = async (username) => {
  const user = await User.findOne({
    where: {
      username: username,
    },
  });
  return user.dataValues;
}
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
  const inventory = await Product.findOne({
    where: {
      status_id: 1, 
      product_uuid: uuid,
    }
  }); 
  return inventory; 
}

// Function to store refresh token in the database
async function storeRefreshToken(userId, refreshToken) {
  try {
    await User.update({ refreshToken }, { where: { user_id: userId } });
    console.log('Refresh token stored successfully');
  } catch (error) {
    console.error('Error storing refresh token:', error);
  }
}

// Function to get user by refresh token
async function getUserByRefreshToken(refreshToken) {
  try {
    const user = await User.findOne({ where: { refreshToken } });
    if (!user) throw new Error('User not found');
    return user.dataValues;
  } catch (error) {
    console.error('Error getting user by refresh token:', error);
    throw error;
  }
}
exports.getInventoryCount = async (username) => {
  const user = await getUserByUsername(username);

  if(!user) {
    throw UserNotFoundException(username);
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [totalCount, todayCount] = await Promise.all([
    Product.count({
      include: [{
        model: User,
        where: { organization_id: user.organization_id }
      }]
    }),
    Product.count({
      where: {  created_at: { [Op.gte]: today },},
      include: [{
        model: User,
        where: { organization_id: user.organization_id }
      }]
    })
  ]);
  return {
    total: totalCount,
    newToday: todayCount
  };}
exports.signup = async (userData) => {
  const { username, email, password, role, created_at } = userData;

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("INVALID_EMAIL_FORMAT");
  }

  // Validate password length
  if (!password || password.length < 6) {
    throw new Error("INVALID_PASSWORD_LENGTH");
  }

  // Check for existing user
  const userExists = await User.findOne({
    where: {
      [Op.or]: [
        { email: email },
        { username: username }
      ]
    },
  });

  if (userExists) {
    if (userExists.email === email) {
      throw new Error("EMAIL_EXISTS");
    }
    if (userExists.username === username) {
      throw new Error("USERNAME_EXISTS");
    }
  }

  const password_hash = await bcrypt.hash(password, 10);
  try {
    const newUser = await User.create({
      username,
      email,
      password_hash,
      role,
      created_at,
      organization_id: 1,
    });

    if (!newUser) {
      throw new Error("Failed to create user");
    }
    
    return newUser.dataValues;
  } catch (error) {
    console.error("Error creating user:", error);
    throw new Error(error.message || "Failed to create user, please try again later");
  }
};

exports.login = async (loginData) => {
  const { email, password } = loginData;

  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  const result = await User.findOne({
    attributes: ['user_id', 'username', 'email', 'password_hash', 'role', 'created_at', 'refreshToken'],
    where: {
      email: email,
    },
  });
  
  if (!result) {
    // Use a generic error message for security
    throw new Error("Invalid email or password");
  }

  const user = result.dataValues;
  const isValid = await bcrypt.compare(password, user.password_hash);
  
  if (!isValid) {
    // Use the same generic error message
    throw new Error("Invalid email or password");
  }

  try {
    const accessToken = jwt.sign(
      { id: user.user_id, username: user.username },
      JWT_CONFIG.ACCESS_TOKEN_SECRET,
      { expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
      { id: user.user_id, username: user.username },
      JWT_CONFIG.REFRESH_TOKEN_SECRET,
      { expiresIn: JWT_CONFIG.REFRESH_TOKEN_EXPIRY }
    );

    await storeRefreshToken(user.user_id, refreshToken);

    return { 
      message: 'Login successful', 
      accessToken, 
      refreshToken, 
      user: { 
        username: user.username,
        role: user.role,
        organization_id: user.organization_id
      }
    };
  } catch (error) {
    console.error("Error during login:", error);
    throw new Error("Authentication failed");
  }
};

exports.verifyUser = async (email, password) => {
  try {
    console.log("Verifying user with email:", email);
    const result = await User.findOne({
      attributes: ['user_id', 'username', 'email', 'password_hash', 'role', 'created_at', 'refreshToken', 'organization_id'],
      where: {
        email: email,
      },
    });

    if (!result) {
      console.log("User not found with email:", email);
      return null;
    }

    const user = result.dataValues;
    console.log("Found user data:", user);

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      console.log("Invalid password for user:", email);
      return null;
    }

    console.log("User verified successfully:", {
      user_id: user.user_id,
      username: user.username,
      role: user.role
    });
    
    return {
      user_id: user.user_id,
      username: user.username,
      role: user.role,
      email: user.email,
      created_at: user.created_at,
      refreshToken: user.refreshToken,
      organization_id: user.organization_id, 
    };
  } catch (error) {
    console.error("Error verifying user:", error);
    throw new Error("Error during user verification");
  }
};

exports.addInventory = async (username, inventoryData) => {
  const user = await getUserByUsername(username);
  if (!user) {
    throw new Error("User not found");
  }

  try {
    const {
      productName,
      productStock,
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
      cost,
      description,
      images,
      statusId
    } = inventoryData;

    // Create inventory with correctly mapped field names
    const inventory = await Product.create({
      product_name: productName,
      product_stock: productStock,
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
      status_id: statusId,
      price: price,
      cost: cost,
      description: description,
      images: images ? { images } : null,
    });

    if (!inventory) {
      throw new Error("Failed to create inventory");
    }
    
    return inventory;
  } catch (error) {
    console.error("Error in addInventory:", error);
    throw new Error(error.message || "Failed to create inventory");
  }
};

exports.updateInventory = async (username, inventoryUUID, updateData) => {
  const user = await getUserByUsername(username);
  if (!user) {
    throw new Error("User not found");
  }

  const {
    productName,        
    productStock,        
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
    cost,       
    description,      
    images             
  } = updateData;

  const dbData = {
    product_name: productName,
    product_stock: productStock,
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
    price: price,
    cost: cost,                    
    description: description,         
    images: images,                   
    user_id: user.user_id,
    organization_id: user.organization_id,
    status_id: 1,
    updated_at: sequelize.literal('CURRENT_TIMESTAMP')
  };

  if (!user) {
    throw new Error("User not found");
  }

  try {
    const [updateCount, [updatedRecord]] = await Product.update(dbData, {
      where: {
        product_uuid: inventoryUUID,
        user_id: user.user_id,
      },
      returning: true
    });

    if (updateCount === 0) {
      throw new Error("Inventory not found");
    }

    const updatedInventory = await Product.findOne({
      where: {
        product_uuid: inventoryUUID,
      }
    });

    return updatedInventory;
  } catch (error) {
    console.error('Update Error:', error);
    throw error;
  }
};

exports.getAllInventory = async (username) => {
  const user = await getUserByUsername(username);
  if (!user) {
    throw new Error("User not found");
  };
  const inventories = await Product.findAll({
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
      await Product.update(
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
        model: Product,
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

  if (!salesOrders || salesOrders.length === 0) {
    throw new Error("Sales Orders not found.");
  }

  const totalPriceResults = await SalesOrderInventory.findAll({
    where: {
      sales_order_id: salesOrders.map((order) => order.sales_order_id),
    },
    attributes: [
      "sales_order_id",
      [sequelize.literal("SUM(price * quantity)"), "total_price"],
    ],
    group: ["sales_order_id"],
    raw: true,
  });

  const salesOrdersWithTotalPrice = salesOrders.map((order) => {
    const totalPriceEntry = totalPriceResults.find(
      (tp) => tp.sales_order_id === order.sales_order_id
    );
    return {
      ...order.toJSON(),
      total_price: totalPriceEntry ? totalPriceEntry.total_price : 0, 
    };
  });

  return salesOrdersWithTotalPrice;
};


exports.deleteInventory = async (username, inventoryuuid) => {
  const user = await getUserByUsername(username);
  const itemObj = await getInventoryByUUID(inventoryuuid);
  const transaction = await sequelize.transaction();
  if(!user){
    throw new Error("User not found");
  }
  try{
    const inventory = await Product.update(
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
exports.storeRefreshToken = storeRefreshToken;
exports.getUserByRefreshToken = getUserByRefreshToken;