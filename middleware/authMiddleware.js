const jwt = require("jsonwebtoken");
const { getUserFromUsername } = require("../controllers/userController");

async function isAuthenticatedUser(req, res, next) {
  console.log("in isAuthenticatedUser middleware");
  // this method checks request header to see if valid jwt is present
  let token;

  // Expects headers.authorization to be in shape "Bearer token abc123"
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[2];
    console.log("Token after split:", token);
  }

  if (!token) {
    return res.status(401).send({
      success: false,
      message: "You are not an authorized user",
    });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log("decoded jwt", decoded);

  // Get the user
  const user = await getUserFromUsername(decoded.username);
  console.log("user:", user[0]);

  req.user = user[0];

  next();
}

function authorizeUserGroups(...allowedGroups) {
  return (req, res, next) => {
    console.log("in authmiddleware, req.user is", req.user);
    console.log("in authmiddleware, groups is", ...allowedGroups);
    if (!allowedGroups.includes(req.user.userGroup)) {
      res.send({
        success: false,
        message: "You do not have permission to access this.",
      });
    }

    next();
  };
}

module.exports = { isAuthenticatedUser, authorizeUserGroups };
