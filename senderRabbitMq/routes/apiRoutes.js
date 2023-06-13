const { Router } = require("express");
const Producer = require("../producer");
const producer = new Producer();

const apiRoutes = () => {
  const router = Router();
  router.post("/sendLog", async (req, res) => {
    const { file, bucket } = req.body;
    console.log({ file, bucket });
    const message = await producer.publishMessage(JSON.stringify(req.body));
    res.json(message);
  });
  return router;
};

module.exports = apiRoutes;
