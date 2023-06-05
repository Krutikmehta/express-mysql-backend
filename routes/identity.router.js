const express = require("express");

const router = express.Router();

const identityController = require("../controller/identity.controller");

router.post("/", identityController.post);

module.exports = router;
