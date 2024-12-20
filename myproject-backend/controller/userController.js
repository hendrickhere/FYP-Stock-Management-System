const UserService = require("../service/userService");
const jwt = require('jsonwebtoken');
const { JWT_CONFIG } = require('../config/app.config');
const InventoryAnalyticsService = require('../service/inventoryAnalyticsService');

const generateAccessToken = (user) => {
  return jwt.sign(
    { 
      id: user.user_id, 
      username: user.username,
      role: user.role 
    },
    JWT_CONFIG.ACCESS_TOKEN_SECRET,
    { expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRY }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { 
      id: user.user_id, 
      username: user.username,
      role: user.role 
    },
    JWT_CONFIG.REFRESH_TOKEN_SECRET,
    { expiresIn: JWT_CONFIG.REFRESH_TOKEN_EXPIRY }
  );
};

exports.getStockReport = async (req, res) => {
    try {
        const username = decodeURIComponent(req.params.username);
        console.log('Processing stock report request:', {
            username,
            timeRange: req.query.timeRange,
            params: req.params,
            query: req.query
        });
        
        // Validate username exists
        const user = await UserService.getUserByUsernameAsync(username);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    message: `User not found: ${username}`
                }
            });
        }

        // Log user data to help debug
        console.log('Found user:', {
            userId: user.user_id,
            organizationId: user.organization_id,
            hasOrg: !!user.organization_id
        });

        if (!user.organization_id) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'User has no associated organization'
                }
            });
        }

        // Parse timeRange with a default value
        const timeRange = parseInt(req.query.timeRange) || 30;
        
        // Get the stock report
        const report = await InventoryAnalyticsService.getStockReport(
            user.organization_id,
            timeRange
        );

        return res.status(200).json({
            success: true,
            data: report
        });
        
    } catch (error) {
        console.error('Stock report error:', {
            error: error.message,
            stack: error.stack,
            params: req.params,
            query: req.query
        });

        return res.status(500).json({
            success: false,
            error: {
                message: 'Failed to generate stock report',
                details: error.message
            }
        });
    }
};

exports.getCurrentUser = async (req, res) => {
  try {
    console.log("Received request to fetch current user");
    console.log("Request User ID:", req.user?.id);
    
    const user = await UserService.getUserById(req.user.id);
    if (!user) {
      console.log("User not found with ID:", req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }
    console.log("User data fetched successfully:", user.username);
    return res.status(200).json({ 
      username: user.username,
      email: user.email,  
      role: user.role  
    });
  } catch (error) {
    console.error("Error fetching current user:", error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getInventoryCount = async (req, res) => {
  const {username} = req.query; 

  if(!username) {
    return res.status(400).json({message: "Username cannot be empty!"});
  }

  try{
    var inventoryCount = await UserService.getInventoryCount(username);
    return res.status(200).json({
      message: "Inventory count retrieved", 
      data: inventoryCount,
    }); 
  } catch(err) {
    if(error instanceof InventoryError){
      return res.status(error.statusCode).json({
        success: false,
        error: {
          type: error.name,
          message: error.message,
          statusCode: error.statusCode
        }
      });
    }
    return res.status(500).json({
      success: false,
      error: {
        type: 'UnexpectedError',
        message: 'An unexpected error occurred',
        statusCode: 500
      }
    });
  }
}

exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token is required' });
  }

  try {
    const user = await UserService.getUserByRefreshToken(refreshToken);
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Invalid refresh token' });
      }

      const accessToken = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(user);

      UserService.storeRefreshToken(user.user_id, newRefreshToken);

      res.status(200).json({
        accessToken,
        refreshToken: newRefreshToken
      });
    });
  } catch (error) {
    console.error("Error refreshing token:", error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.signup = async (req, res) => {
  console.log("Received signup data:", req.body);
  try {
    const signupData = req.body;
    const user = await UserService.signup(signupData);
    res.status(201).send({ message: "User created", user: user });
  } catch (err) {
    console.error("Error during signup:", err.message);
    
    switch (err.message) {
      case "INVALID_EMAIL_FORMAT":
        return res.status(400).send({ 
          message: "Please enter a valid email address" 
        });
      case "INVALID_PASSWORD_LENGTH":
        return res.status(400).send({ 
          message: "Password must be at least 6 characters long" 
        });
      case "EMAIL_EXISTS":
        return res.status(409).send({ 
          message: "This email is already registered" 
        });
      case "USERNAME_EXISTS":
        return res.status(409).send({ 
          message: "This username is already taken" 
        });
      default:
        return res.status(500).send({ 
          message: "An error occurred during signup. Please try again." 
        });
    }
  }
};

exports.login = async (req, res) => {
  try {
    console.log("Login request received:", req.body);

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await UserService.verifyUser(email, password);
    
    // Changed this part to be more specific with error messages
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    console.log("Verified user data:", user); 

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await UserService.storeRefreshToken(user.user_id, refreshToken);

    res.status(200).json({ 
      message: 'Login successful', 
      accessToken, 
      refreshToken, 
      user: { 
        username: user.username,
        role: user.role, 
        organization_id: user.organization_id 
      }
    });

  } catch (error) {
    console.error("Error during login:", error);
    // More specific error handling
    if (error.message === "Error during user verification") {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    res.status(500).json({ message: 'An error occurred during login. Please try again.' });
  }
};

exports.addInventory = async (req, res) => {
  const username = req.params.username;
  const inventoryData = req.body;

  try {
    const inventory = await UserService.addInventory(username, inventoryData);
    res
      .status(200)
      .send({ inventory: inventory, message: "Inventory added successfully." });
  } catch (err) {
    if (err.message === "Failed to create inventory") {
      res.status(401).send({ message: err.message });
    } else if (err.message === "User not found") {
      res.status(402).send({ message: err.message });
    } else {
      res.status(500).send({ message: err.message });
    }
  }
};

exports.updateInventory = async (req, res) => {
  const username = req.params.username;
  const inventoryUUID = req.params.inventoryuuid;
  const inventoryData = req.body;

  try {
    const inventoryUpdate = await UserService.updateInventory(
      username,
      inventoryUUID,
      inventoryData
    );
    res
      .status(200)
      .send({
        inventory: inventoryUpdate,
        message: "Inventory updated successfully.",
      });
  } catch (err) {
    if (err.message === "Inventory not found") {
      res.status(404).send({ message: err.message });
    } else if (err.message === "User not found") {
      res.status(401).send({ message: err.message });
    } else {
      res.status(500).send({ message: err.message });
    }
  }
};

exports.getAllInventory = async (req, res) => {
  const { username } = req.params;
  const { searchTerm } = req.query;

  try {
    const inventories = await UserService.getAllInventory(username, searchTerm);
    
    return res.status(200).json({
      success: true,
      inventories,
      message: "Inventories retrieved successfully."
    });

  } catch (err) {
    console.error('Error in getAllInventory:', err);

    switch (err.message) {
      case "User not found":
        return res.status(401).json({
          success: false,
          message: err.message
        });

      case "No inventories found":
        return res.status(404).json({
          success: false,
          message: err.message,
          inventories: [] // Send empty array instead of null
        });

      default:
        return res.status(500).json({
          success: false,
          message: "Failed to retrieve inventories"
        });
    }
  }
};

exports.addInventoryBatch = async (req, res) => {
  try {
    const { id: userId } = req.user; // Get user ID from JWT token
    const { products } = req.body;

    if (!Array.isArray(products)) {
      return res.status(400).json({ message: "Products must be an array" });
    }

    const createdProducts = await UserService.addInventoryBatch(userId, products);
    
    res.status(200).json({
      message: "Products added successfully",
      products: createdProducts
    });
  } catch (err) {
    console.error('Error in batch product creation:', err);
    if (err.message === "User not found") {
      return res.status(401).json({ message: err.message });
    }
    res.status(500).json({ 
      message: err.message || "Error creating products" 
    });
  }
};

exports.addSalesOrder = async (req, res) => {
  const username = req.params.username;
  const salesOrderData = req.body;
  try {
    const salesOrder = await UserService.addSalesOrder(
      username,
      salesOrderData
    );
    res
      .status(200)
      .send({ salesOrder: salesOrder, message: "Order created successfully" });
  } catch (err) {
    if (
      err.message ===
      "Unable to create sales order due to low stock volume, please try again after stock volume is increased."
    ) {
      res.status(402).send({ message: err.message });
    } else if (err.message === "User not found") {
      res.status(401).send({ message: err.message });
    } else if (err.message === "Failed to create sales order") {
      res.status(404).send({ message: err.message });
    } else {
      res.status(500).send({ message: err.message });
    }
  }
};

exports.getSalesOrder = async (req, res) => {
  const username = req.params.username;

  try {
    const salesOrders = await UserService.getSalesOrder(username);
    res
      .status(200)
      .send({
        salesOrders: salesOrders,
        message: "Sales Orders retrieved successfully.",
      });
  } catch (err) {
    if (err.message === "User not found") {
      res.status(401).send({ message: err.message });
    } else if (err.message === "Sales Orders not found.") {
      res.status(404).send({ message: err.message });
    } else {
      res.status(500).send({ message: err.message });
    }
  }
};

exports.deleteInventory = async (req, res) => {
  const username = req.params.username;
  const inventoryUUID = req.params.inventoryuuid;

  try {
    const result = await UserService.deleteInventory(username, inventoryUUID);
    res.status(200).json({
      success: true,
      deletedProductUUID: result.deletedProduct,
      message: "Product successfully deleted"
    });
  } catch (err) {
    console.error('Delete inventory error:', err);
    
    switch(err.message) {
      case "User not found":
        return res.status(401).json({ message: err.message });
      case "Product not found":
        return res.status(404).json({ message: err.message });
      case "No products were updated":
        return res.status(400).json({ message: "Failed to delete product" });
      default:
        return res.status(500).json({ 
          message: "An error occurred while deleting the product",
          error: err.message 
        });
    }
  }
};

exports.getInventory = async (req, res) => {
  const inventoryUUID = req.params.inventoryuuid;
  const username = req.params.username;

  try {
    const inventory = await UserService.getInventory(username, inventoryUUID);
    res.status(200).send({
      status: inventory,
      message: "Inventory successfully retrieved!",
    });
  } catch (err) {
    if (err.message === "User not found") {
      res.status(401).send({ message: err.message });
    } else if (err.message === "Inventory not found") {
      res.status(402), send({ message: err.message });
    } else {
      res.status(500).send({ message: err.message });
    }
  }
};

exports.updateProfile = async (req, res) => {
  try {
    console.log('Update Profile Request:', {
      user: req.user,
      body: req.body
    });

    const { id } = req.user;
    const { username, email } = req.body;

    // Input validation
    if (!username || !email) {
      console.log('Validation failed:', { username, email });
      return res.status(400).json({
        success: false,
        message: 'Username and email are required'
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    const updatedUser = await UserService.updateProfile(id, { username, email });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Profile update error:', error);
    
    // Handle specific errors
    switch (error.message) {
      case 'EMAIL_EXISTS':
        return res.status(409).json({
          success: false,
          message: 'Email is already in use'
        });
      case 'USERNAME_EXISTS':
        return res.status(409).json({
          success: false,
          message: 'Username is already taken'
        });
      case 'User not found':
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      default:
        return res.status(500).json({
          success: false,
          message: 'An error occurred while updating profile'
        });
    }
  }
};