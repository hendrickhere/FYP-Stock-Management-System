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
      return res
        .status(200)
        .json({
          vendor: uploadSuccess,
          message: "Vendor created successfully",
        });
    } else {
      return res
        .status(500)
        .json({
          errorMessage: "Vendor failed to create, please try again later",
        });
    }
  } catch (err) {
    return res.status(500).json({ errorMessage: err });
  }
};
