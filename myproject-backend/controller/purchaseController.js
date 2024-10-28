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
