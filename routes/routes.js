const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const userController = require("../controllers/userController");
const userGroupController = require("../controllers/userGroupController");

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
router
  .route("/users")
  .get(
    isAuthenticatedUser,
    authorizeUserGroups(["admin"]),
    userController.allUsers
  );
router
  .route("/usergroups")
  .get(
    isAuthenticatedUser,
    authorizeUserGroups(["admin"]),
    userGroupController.getAll
  );
router
  .route("/checkusergroup")
  .post(isAuthenticatedUser, authController.checkUserGroup);

router
  .route("/get_current_user")
  .get(isAuthenticatedUser, userController.getCurrentUserDetails);

module.exports = router;
