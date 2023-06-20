const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const sampleController = require("../controllers/sampleController");

router.route("/login").post(authController.login);
// router.route("/register").post(authController.register);
// router.route("/users").get(authController.getUsers);

// router.route("/sample").get(sampleController.getUsers);

module.exports = router;
