const { User, Vendor, Customer } = require("../models/association");
const { v4: uuidv4 } = require("uuid");

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
    const mappedCustomers = customers.map(customer => {
        return {
          ...customer.dataValues, 
          registration_date: customer.createdAt, 
          status: customer.status_id
        };
      });
  
      return mappedCustomers;
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

async function getUserFromUsername(username) {
  const user = await User.findOne({
    where: {
      username,
    },
  });

  return user;
}
