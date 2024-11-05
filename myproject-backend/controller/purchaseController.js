const PurchaseService = require("../service/purchaseService");

exports.getAllPurchase = async (req, res) => {
  const pageNumber = req.query.pageNumber;
  const pageSize = req.query.pageSize;
  const username = req.params.username;

  try {
    const result = await PurchaseService.getAllPurchases(
      username,
      pageNumber,
      pageSize
    );
    if(result === null){
        return res.status(404).json({ message: "No purchase orders found" });
    }
    res.status(200).json({ purchases: result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.insertPurchase = async (req, res) => {
  const reqBody = req.body;

  try {
    const result = await PurchaseService.insertPurchase(reqBody);

    if (result) {
      res
        .status(200)
        .json({
          purchaseOrder: result,
          message: "Purchase Order inserted successfully",
        });
    }
  } catch (err) {
    res.status(500).json({ errorMessage: err.message });
  }
};
