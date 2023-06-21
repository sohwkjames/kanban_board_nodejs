const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const userController = require("../controllers/userController");
const {
  isAuthenticatedUser,
  authorizeUserGroups,
} = require("../middleware/authMiddleware");

router.route("/login").post(authController.login);
router
  .route("/user")
  .post(
    isAuthenticatedUser,
    authorizeUserGroups(["admin"]),
    userController.register
  );
router.route("/admin").get();
router
  .route("/checkusergroup")
  .post(isAuthenticatedUser, authController.checkUserGroup);

module.exports = router;
