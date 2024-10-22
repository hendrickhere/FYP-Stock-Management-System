const UserService = require("../service/userService");
const jwt = require('jsonwebtoken');

exports.getCurrentUser = async (req, res) => {
  try {
    console.log("Received request to fetch current user"); // Log that request was received
    console.log("Request User ID:", req.user?.id); // Log the user ID from req
    // Assuming `req.user` is populated by the auth middleware
    const user = await UserService.getUserById(req.user.id);
    if (!user) {
      console.log("User not found with ID:", req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }
    console.log("User data fetched successfully:", user.username);
    return res.status(200).json({ username: user.username }); // Make sure to return the username
  } catch (error) {
    console.error("Error fetching current user:", error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
  console.log('Fetching user with ID:', req.user.id); // Check if the ID is correct

};


exports.signup = async (req, res) => {
  console.log("Received signup data:", req.body);
  try {
    const signupData = req.body;
    const user = await UserService.signup(signupData);
    res.status(201).send({ message: "User created", user: user });
  } catch (err) {
    console.error("Error during signup:", err.message, err.stack);
    if (err instanceof TypeError) {
      res.status(400).send({ message: "Bad input format", error: err.message });
    } else if (err.message == "Password is required") {
      res.status(400).send({ message: "Password is required" });
    } else if (err.message == "User already exists") {
      res.status(409).send({ message: "User already exists" });
    } else res.status(500).send({ message: "Server error", err: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    console.log("Login request received:", req.body); // Log incoming request

    const { email, password } = req.body;

    // Validate that required fields are provided
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Call verifyUser from UserService
    const user = await UserService.verifyUser(email, password);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' }); // Return if credentials are invalid
    }

    // Generate a JWT token for the verified user
    console.log("Generating token for user:", user.username);
    const token = jwt.sign({ id: user.user_id, username: user.username }, 'secretkey123', { expiresIn: '1h' });

    // Return token and user details to frontend
    res.status(200).json({ message: 'Login successful', token, user: { username: user.username } });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.addCustomer = async (req, res) => {
  const customerData = req.body;
  const username = req.params.username;
  try {
    const customer = await UserService.addCustomer(customerData, username);
    res
      .status(200)
      .send({ customer: customer, message: "customer created successfully" });
  } catch (err) {
    if (err.message === "Failed to create customer, please try again later.") {
      res.status(401).send({ message: err.message });
    } else if (err.message === "User does not exist") {
      res.status(402).send({ message: err.message });
    } else {
      res.status(500).send({ message: err.message });
    }
  }
};

exports.getAllCustomers = async (req, res) => {
  const username = req.params.username;

  try {
    const customers = await UserService.getAllCustomers(username);
    res.status(200).send({
      customers: customers,
      message: "customers details retrieved successfully.",
    });
  } catch (err) {
    if (err.message === "No customers found.") {
      res.status(200).send({ message: err.message });
    } else if (err.message === "User does not exist") {
      res.status(402).send({ message: err.message });
    } else {
      res.status(500).send({ message: err.message });
    }
  }
};

exports.getCustomer = async (req, res) => {
  const customerUuid = req.params.customeruuid;
  const username = req.params.username;

  try {
    const customer = await UserService.getCustomer(customerUuid, username);
    res.status(200).send({
      customer: customer,
      message: "customer details retrieved successfully.",
    });
  } catch (err) {
    if (err.message === "Error retrieving customer details.") {
      res.status(401).send({ message: err.message });
    } else if (err.message === "User does not exist") {
      res.status(402).send({ message: err.message });
    } else {
      res.status(500).send({ message: err.message });
    }
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
  const username = req.params.username;
  try {
    const inventories = await UserService.getAllInventory(username);
    res
      .status(200)
      .send({
        inventories: inventories,
        message: "Inventories retrieved successfully.",
      });
  } catch (err) {
    if (err.message === "User not found") {
      res.status(401).send({ message: err.message });
    } else if (err.message === "No inventories found") {
      res.status(404).send({ message: err.message });
    } else {
      res.status(500).send({ message: err.message });
    }
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
    const status = await UserService.deleteInventory(username, inventoryUUID);
    res
      .status(200)
      .send({ status: status, message: "Inventory deleted successfully" });
  } catch (err) {
    if (err.message === "User not found") {
      res.status(401).send({ message: err.message });
    } else if (err.message === "Inventory not found.") {
      res.status(404).send({ message: err.message });
    } else {
      res.status(500).send({ message: err.message });
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
