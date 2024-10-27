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
        res.status(404).send({message: "No purchase orders found"});
    }
    res.status(200).send({data: result});
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};
