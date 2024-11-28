const { User, Vendor, Customer } = require("../models");
const { v4: uuidv4 } = require("uuid");
const { Op } = require("sequelize");
exports.getAllVendors = async (username) => {
  const existingUser = await getUserFromUsername(username);

  if (existingUser === null) {
    throw new Error("No user found");
  }

  const allVendors = await Vendor.findAll({
    include: [
      {
        model: User,
        where: {
          organization_id: existingUser.organization_id,
        },
        attributes: [],
      },
    ],
  });
  if (!allVendors) {
    throw new Error("No vendors found");
  }
  return allVendors;
};

exports.uploadVendor = async (username, vendorData) => {
  const { vendorName, contactPerson, phoneNumber, address } = vendorData;

  const existingUser = await getUserFromUsername(username);

  if (existingUser === null) {
    throw new Error("No user found");
  }
  const guid = uuidv4();

  const newVendor = await Vendor.create({
    user_id: existingUser.user_id,
    vendor_name: vendorName,
    vendor_sn: guid.toString(),
    contact_person: contactPerson,
    phone_number: phoneNumber,
    address: address,
    statusId: 1,
    createdAt: new Date().toISOString(),
  });
  if (!newVendor) {
    throw new Error("Failed to create vendor, please try again later");
  }
  return newVendor.dataValues;
};

exports.updateVendor = async (vendorId, vendorData, username) => {
  try {
    const user = await getUserFromUsername(username);
    if (!user) {
      throw new Error("User not found");
    }

    const existingVendor = await Vendor.findOne({
      where: {
        vendor_id: vendorId,
        user_id: user.user_id,
      },
    });

    if (!existingVendor) {
      throw new Error("Vendor not found");
    }

    await Vendor.update(
      {
        vendor_name: vendorData.vendorName,
        contact_person: vendorData.contactPerson,
        phone_number: vendorData.phoneNumber,
        address: vendorData.address,
        updated_at: new Date(),
      },
      {
        where: {
          vendor_id: vendorId,
          user_id: user.user_id,
        },
      }
    );

    const updatedVendor = await Vendor.findOne({
      where: {
        vendor_id: vendorId,
        user_id: user.user_id,
      },
    });

    return updatedVendor;
  } catch (error) {
    console.error("Service error updating vendor:", error);
    throw new Error(`Failed to update vendor: ${error.message}`);
  }
};

exports.deleteVendor = async (vendorId, username) => {
  const user = await getUserFromUsername(username);
  if (!user) throw new Error("User not found");

  const result = await Vendor.destroy({
    where: {
      vendor_id: vendorId,
      user_id: user.user_id,
    },
  });

  if (!result) throw new Error("Vendor not found or already deleted");
  return true;
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

exports.getAllCustomers = async (username, pageNumber, pageSize) => {
  const user = await getUserFromUsername(username);

  if (user) {
    const customers = await Customer.findAll({
      include: [
        {
          model: User,
          where: {
            organization_id: user.organization_id,
          },
          attributes: [],
        },
      ],
    });
    if (!customers) {
      throw new Error("No customers found.");
    }
    const mappedCustomers = customers.map((customer) => {
      return {
        ...customer.dataValues,
        registration_date: customer.createdAt,
        status: customer.status_id,
      };
    });

    return mappedCustomers;
  } else {
    throw new Error("User does not exist.");
  }
};

exports.getCustomerCount = async (username) => {
  const user = await getUserFromUsername(username);

  if (!user) {
    throw new UserNotFoundException(username);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalCount, todayCount] = await Promise.all([
    Customer.count({
      include: [
        {
          model: User,
          where: { organization_id: user.organization_id },
        },
      ],
    }),
    Customer.count({
      where: {
        created_at: { [Op.gte]: today },
      },
      include: [
        {
          model: User,
          where: { organization_id: user.organization_id },
        },
      ],
    }),
  ]);

  return {
    total: totalCount,
    newToday: todayCount,
  };
};

exports.getCustomer = async (customerUuid, username) => {
  const user = await getUserFromUsername(username);

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

async function getUserFromUsername(username) {
  const user = await User.findOne({
    where: {
      username,
    },
  });

  return user;
}

exports.updateCustomer = async (uuid, customerData, username) => {
  try {
    // First verify the user exists
    const user = await getUserFromUsername(username);
    if (!user) {
      throw new Error("User not found");
    }

    // Find the customer first to verify it exists
    const existingCustomer = await Customer.findOne({
      where: {
        customer_uuid: uuid,
        user_id: user.user_id,
      },
    });

    if (!existingCustomer) {
      throw new Error("Customer not found");
    }

    // Update the customer
    await Customer.update(
      {
        customer_name: customerData.customerName,
        customer_email: customerData.customerEmail,
        customer_designation: customerData.customerDesignation,
        customer_contact: customerData.customerContact,
        customer_company: customerData.customerCompany,
        billing_address: customerData.billingAddress,
        shipping_address: customerData.shippingAddress,
        updated_at: new Date(),
      },
      {
        where: {
          customer_uuid: uuid,
          user_id: user.user_id,
        },
      }
    );

    // Fetch and return the updated customer
    const updatedCustomer = await Customer.findOne({
      where: {
        customer_uuid: uuid,
        user_id: user.user_id,
      },
    });

    return updatedCustomer;
  } catch (error) {
    console.error("Service error updating customer:", error);
    throw new Error(`Failed to update customer: ${error.message}`);
  }
};

exports.deleteCustomer = async (uuid, username) => {
  const user = await getUserFromUsername(username);
  if (!user) throw new Error("User not found");

  const result = await Customer.destroy({
    where: {
      customer_uuid: uuid,
      user_id: user.user_id,
    },
  });

  if (!result) throw new Error("Customer not found or already deleted");
  return true;
};
