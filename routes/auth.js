const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const sampleController = require("../controllers/sampleController");

router.route("/login").post(authController.login);
router.route("/user").post(authController.register);
// router.route("/user/:username").get(authController.getUsers);
router.route("/checkgroup").post(authController.checkUserGroup);

module.exports = router;
