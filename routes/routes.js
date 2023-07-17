const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const userController = require("../controllers/userController");
const userGroupController = require("../controllers/userGroupController");
const applicationController = require("../controllers/applicationController");
const taskController = require("../controllers/taskController");
const planController = require("../controllers/planController");
const notesController = require("../controllers/notesController");

const {
  isAuthenticatedUser,
  authorizeUserGroups,
  authorizeAction,
} = require("../middleware/authMiddleware");

// IAM endpoints
router.route("/login").post(authController.login);
router
  .route("/user")
  .post(
    isAuthenticatedUser,
    authorizeUserGroups(["admin"]),
    userController.create
  );

router
  .route("/user")
  .put(
    isAuthenticatedUser,
    authorizeUserGroups(["admin"]),
    userController.update
  );

router
  .route("/user")
  .get(isAuthenticatedUser, userController.getCurrentUserDetails);

router
  .route("/userprofile")
  .put(isAuthenticatedUser, userController.updateUserProfile);

router
  .route("/users")
  .get(
    isAuthenticatedUser,
    authorizeUserGroups(["admin"]),
    userController.allUsers
  );

router.route("/usergroups").get(
  isAuthenticatedUser,
  // authorizeUserGroups([
  //   "admin",
  //   "projectLead",
  //   "projectManager",
  //   "developer",
  // ]),
  userGroupController.getAll
);

router
  .route("/usergroups")
  .post(
    isAuthenticatedUser,
    authorizeUserGroups(["admin"]),
    userGroupController.add
  );

router
  .route("/my-usergroups")
  .get(isAuthenticatedUser, userGroupController.getMyUserGroups);

router
  .route("/check-permission")
  .post(isAuthenticatedUser, authController.checkUserCanPerformActionEndpoint);

// This endpoint is a special reqeust from client
router
  .route("/checkusergroup")
  .post(isAuthenticatedUser, authController.checkUserGroup);

// ---- TMS ENDPOINTS ----
router
  .route("/applications")
  .post(
    isAuthenticatedUser,
    authorizeUserGroups(["projectLead"]),
    applicationController.create
  );

router
  .route("/applications")
  .put(
    isAuthenticatedUser,
    authorizeUserGroups(["projectLead"]),
    applicationController.edit
  );

router
  .route("/applications")
  .get(isAuthenticatedUser, applicationController.getAll);

router
  .route("/applications/:appAcronym")
  .get(isAuthenticatedUser, applicationController.getOne);

router
  .route("/applications/earliest-end-date")
  .post(isAuthenticatedUser, applicationController.getEarliestEndDate);

router
  .route("/applications/latest-end-date")
  .post(isAuthenticatedUser, applicationController.getLatestEndDate);

router.route("/plans").post(
  isAuthenticatedUser,
  authorizeAction("App_permit_open"),
  // authorizeUserGroups(["projectManager"]),
  planController.create
);

router.route("/plans").get(isAuthenticatedUser, planController.getAll);
router
  .route("/plans/:appAcronym")
  .get(isAuthenticatedUser, planController.getByAppAcronym);

router.route("/tasks").post(isAuthenticatedUser, taskController.create);

router.route("/task/:taskId").get(isAuthenticatedUser, taskController.getTask);
router.route("/tasks").put(isAuthenticatedUser, taskController.editTask);

router
  .route("/task/promote")
  .post(isAuthenticatedUser, taskController.editAndPromoteTask);

router
  .route("/task/demote")
  .post(isAuthenticatedUser, taskController.editAndDemoteTask);

router.route("/tasks-by-app").post(
  isAuthenticatedUser,
  // authorizeAction("App_permit_create"),
  taskController.getTaskByApp
);

router.route("/notes").post(
  isAuthenticatedUser,
  // authorizeAction("App_permit_create"),
  notesController.addNotes
);

router.route("/tasks-by-plan").post(
  isAuthenticatedUser,
  // authorizeAction("App_permit_create"),
  taskController.getTaskByPlan
);

module.exports = router;
