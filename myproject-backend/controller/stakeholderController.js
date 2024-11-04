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
