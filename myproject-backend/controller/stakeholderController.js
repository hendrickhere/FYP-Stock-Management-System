const StakeholderService = require("../service/stakeholderService");
const UserService = require("../service/userService");

exports.getVendors = async (req, res) => {
  try {
    const user = req.query.username;
    if (!user) {
      return res.status(400).json({ message: "Username is required" });
    }
    const vendors = await StakeholderService.getAllVendors(user);

    if (vendors === null) {
      return res
        .status(200)
        .json({ vendors: [], message: "No vendors data found" });
    }
    return res.status(200).json({ vendors: vendors });
  } catch (err) {
    console.error(err);
    return res.status(500).send(err);
  }
};

exports.uploadVendors = async (req, res) => {
  try {
    const { username } = req.body;
    const vendorData = req.body;

    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }

    const uploadSuccess = await StakeholderService.uploadVendor(
      username,
      vendorData
    );

    if (uploadSuccess !== null) {
      return res.status(200).json({
        vendor: uploadSuccess,
        message: "Vendor created successfully",
      });
    } else {
      return res.status(500).json({
        errorMessage: "Vendor failed to create, please try again later",
      });
    }
  } catch (err) {
    return res.status(500).json({ errorMessage: err });
  }
};

exports.updateVendor = async (req, res) => {
  try {
    const vendorId = req.params.vendor_id;
    const username = req.query.username;
    const vendorData = req.body;

    if (!vendorId || !username) {
      return res.status(400).json({ 
        message: "Vendor ID and username are required" 
      });
    }

    const updatedVendor = await StakeholderService.updateVendor(
      vendorId,
      vendorData,
      username
    );

    return res.status(200).json({
      vendor: updatedVendor,
      message: "Vendor updated successfully"
    });

  } catch (error) {
    console.error("Error updating vendor:", error);
    return res.status(500).json({ 
      message: error.message || "Failed to update vendor" 
    });
  }
};

exports.deleteVendor = async (req, res) => {
  try {
    const vendorId = req.params.vendor_id;
    const username = req.query.username;

    if (!vendorId || !username) {
      return res.status(400).json({ message: "Vendor ID and username are required" });
    }

    await StakeholderService.deleteVendor(vendorId, username);
    return res.status(200).json({ message: "Vendor deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.addCustomer = async (req, res) => {
  const customerData = req.body;
  const username = req.query.username;
  try {
    const customer = await StakeholderService.addCustomer(customerData, username);
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
  const username = req.query.username;

  try {
    const customers = await StakeholderService.getAllCustomers(username);
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
  const customerUuid = req.params.uuid;
  const username = req.query.username;

  try {
    const customer = await StakeholderService.getCustomer(customerUuid, username);
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

exports.getCustomerCount = async (req, res) => {
  const { username } = req.query; 

  try{
    if(!username){
      return res.status(400).json({
        message: "Username cannot be empty!"
      });
    }
    var count = await StakeholderService.getCustomerCount(username);

    return res.status(200).json({
      message: "Customer count retrieved", 
      data: count,
    });

  } catch (err) {
    return res.status(500).json({
      message: `Unexpected error occurred, ${err.message}`
    });
  }
}

exports.updateCustomer = async (req, res) => {
  try {
    const uuid = req.params.uuid;
    const username = req.query.username;
    const customerData = req.body;

    if (!uuid || !username) {
      return res.status(400).json({ 
        message: "Customer UUID and username are required" 
      });
    }

    const updatedCustomer = await StakeholderService.updateCustomer(
      uuid, 
      customerData, 
      username
    );

    return res.status(200).json({
      customer: updatedCustomer,
      message: "Customer updated successfully"
    });

  } catch (error) {
    console.error("Error updating customer:", error);
    return res.status(500).json({ 
      message: error.message || "Failed to update customer" 
    });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const uuid = req.params.uuid;
    const username = req.query.username;

    if (!uuid || !username) {
      return res.status(400).json({ message: "Customer UUID and username are required" });
    }

    await StakeholderService.deleteCustomer(uuid, username);
    return res.status(200).json({ message: "Customer deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getStaffs = async (req, res) => {
  
}
