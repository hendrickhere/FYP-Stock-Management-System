const { User, Vendor } = require("../models/association");
const { v4: uuidv4 } = require('uuid');


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
  const { vendorName, contactPerson, phoneNumber, address } =
    vendorData;

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

async function getUserFromUsername(username) {
  const user = await User.findOne({
    where: {
      username,
    },
  });

  return user;
}
