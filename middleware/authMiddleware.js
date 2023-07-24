const jwt = require("jsonwebtoken");
const { getCompleteUser, getUserGroups } = require("../controllers/userController");
const { CheckGroup } = require("../controllers/authController");

async function isAuthenticatedUser(req, res, next) {
    // this method checks request header to see if valid jwt is present
    let token;
    // Expects headers.authorization to be in shape "Bearer token abc123"
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        // console.log("token true branch");
        token = req.headers.authorization.split(" ")[2];
    }
    // console.log("req.heads.authorization", req.heads.authorization);

    if (!token) {
        return res.send({
            success: false,
            message: "You are not an authorized user",
        });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get the user object
    const user = await getCompleteUser(decoded.username);
    req.user = user[0];

    // Check if user is active. If not active, cannot do anything.
    if (!req.user.isActive) {
        return res.send({
            success: false,
            message: "User is currently inactive",
        });
    }

    // console.log("in isAuthenticatedUser calling next");

    next();
}

function authorizeUserGroups(allowedGroups) {
    // Expects req.user to be available
    // allowedGroups: string[]
    // Returns response on fail, calls next() on success

    return (req, res, next) => {
        // Get user groups for the user
        const user = req.user;

        let isAuthorized = false;

        user.userGroups.forEach((group) => {
            if (allowedGroups.includes(group)) {
                isAuthorized = true;
            }
        });

        if (isAuthorized) {
            // console.log("authrozeUserGroups calling first next");
            next();
        } else {
            // console.log("authrozeUserGroups res.send");

            return res.send({
                success: false,
                message: "You do not have permission to access this resource.",
            });
        }

        // next();
    };
}

function authorizeAction(taskState) {
    // Checks if current user can perform action on taskState
    // taskState points to the DB col eg "App_permit_create"
    // req.user and req.body.appAcronym must be available

    return async (req, res, next) => {
        const user = req.user;
        const { appAcronym } = req.body;

        const app = await new Promise((resolve, reject) => {
            const sql = "SELECT * FROM application WHERE App_acronym = ?";
            connection.query(sql, [appAcronym], (err, result) => {
                resolve(result[0]);
            });
        });

        const permittedGroup = app[taskState];
        const result = await CheckGroup(user.username, permittedGroup);
        next();
    };
}

module.exports = { isAuthenticatedUser, authorizeUserGroups, authorizeAction };
