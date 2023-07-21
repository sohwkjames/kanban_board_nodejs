const jwt = require("jsonwebtoken");
const { sendToken } = require("../utils/jwtToken");
const bcrypt = require("bcryptjs");
const mysql = require("mysql");
const { USER_GROUPS } = require("../utils/userGroups");
const { isValidPassword } = require("../utils/auth");
const { getCompleteUser } = require("./userController");
const { config } = require("../utils/dbConfig");

// const config = {
//   host: "localhost",
//   user: "root",
//   password: process.env.LOCAL_DB_PASSWORD,
//   database: process.env.LOCAL_DB_DATABASE,
//   multipleStatements: true,
// };

connection = mysql.createConnection(config);

const saltRounds = 10;

async function login(req, res, next) {
    const { username, password } = req.body;

    try {
        const user = await getCompleteUser(username);

        console.log(user);
        console.log(password);

        const isValidCredentials = await bcrypt.compare(password, user[0].password);

        if (!isValidCredentials) {
            return res.send({
                success: false,
                message: "Invalid username or password",
            });
        }

        // Check if user is an admin
        const isAdmin = await CheckGroup(user.username, "admin");

        // Generate JWT with username only.
        const token = jwt.sign(
            {
                username: user[0].username,
                isAdmin: isAdmin,
            },
            process.env.JWT_SECRET
        );
        console.log("token", token);

        // Send token to FE in response
        res.status(200).send({
            success: true,
            token: token,
            userGroups: user[0].userGroups,
            isActive: user[0].isActive,
        });
    } catch {
        res.send({
            success: false,
            message: "Invalid username or password",
        });
    }
}

async function register(req, res, next) {
    const { username, password, email, isActive, userGroups } = req.body;

    // Check if username exists
    const user = await getUserFromUsername(username);
    if (user.length) {
        return res.send({
            success: false,
            message: "Username already exists",
        });
    }

    if (!username) {
        return res.send({
            success: false,
            message: "Must have username.",
        });
    }

    if (!isValidPassword(password)) {
        return res.send({
            success: false,
            message: "Password must be 8-10 characters, contain at least 1 number, at least 1 character, and at least 1 special character.",
        });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const result = await registerHelper(username, hashedPassword, email, userGroups, isActive);

    res.status(200).send({
        success: true,
        result,
    });
}

async function registerHelper(username, hashedPassword, email, userGroups, isActive) {
    const sql = "INSERT INTO accounts (username, password, email, isActive) VALUES (?, ?, ?, ?)";

    return new Promise((resolve, reject) => {
        connection.query(sql, [username, hashedPassword, email, isActive], function (err, result, fields) {
            if (err) {
                reject(err);
            }
            // resolve(result);
            const sql = "INSERT INTO username_usergroup_pivot (username, usergroup) VALUES (?, ?)";
            connection.query(sql, [username, userGroup], function (err, result, fields) {
                if (err) reject(err);
                resolve(result);
            });
        });
    });
}

async function checkUserGroup(req, res, next) {
    const { groupname } = req.body;
    const username = req.user.username;

    const isUserInGroup = await CheckGroup(username, groupname);
    if (isUserInGroup) {
        return res.status(200).send({
            success: true,
        });
    } else {
        return res.send({
            success: false,
            message: "You are not authorized to access this resource",
        });
    }
}

async function CheckGroup(userid, groupname) {
    // Returns a promise that resolves into boolean
    const sql = "SELECT * FROM username_usergroup_pivot WHERE username=? AND usergroup=?";
    return new Promise((resolve, reject) => {
        connection.query(sql, [userid, groupname], function (err, result, fields) {
            if (err) {
                reject(false);
            }
            if (result.length) {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    });
}

async function checkUserCanPerformActionEndpoint(req, res, next) {
    const { appAcronym, actionName } = req.body;
    const username = req.user.username;

    const result = await checkUserCanPerformAction(appAcronym, username, actionName);
    res.send({ success: result });
}

// Returns true or false
async function checkUserCanPerformAction(appAcronym, username, actionName) {
    console.log("appAcronym", appAcronym);
    // Get the appname permissions
    const app = await new Promise((resolve, reject) => {
        const sql = "SELECT * FROM application WHERE App_acronym = ?";
        connection.query(sql, [appAcronym], (err, result) => {
            if (!result || result.length === 0) {
                reject("test");
            }
            resolve(result[0]);
        });
    });
    console.log("app", app);
    const permittedGroup = app[actionName];

    const result = await CheckGroup(username, permittedGroup);

    return result;
    // Get username's usergroups

    // Check if action to perform eg 'App_permit_create' is in appname permissions group
}

module.exports = {
    login,
    checkUserGroup,
    checkUserCanPerformAction,
    checkUserCanPerformActionEndpoint,
    CheckGroup,
};
