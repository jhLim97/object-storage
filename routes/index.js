var express = require("express");
var router = express.Router();
const fileController = require("../controller/fille_controller");

router.get("/", fileController.processFile);

module.exports = router;
