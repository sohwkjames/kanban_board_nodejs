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
  }

  if (!token) {
    return res.send({
      success: false,
      message: "You are not an authorized user",
    });
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // Get the user
  const user = await getUserFromUsername(decoded.username);

  req.user = user[0];

  next();
}

function authorizeUserGroups(allowedGroups) {
  return (req, res, next) => {
    if (!allowedGroups.includes(req.user.userGroup)) {
      console.log("in the disallow branch");
      return res.send({
        success: false,
        message: "You do not have permission to access this.",
      });
    }

    next();
  };
}

module.exports = { isAuthenticatedUser, authorizeUserGroups };
