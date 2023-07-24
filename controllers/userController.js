const jwt = require("jsonwebtoken");
const { sendToken } = require("../utils/jwtToken");
const bcrypt = require("bcryptjs");
const mysql = require("mysql");
const { USER_GROUPS } = require("../utils/userGroups");
const { isValidPassword } = require("../utils/auth");
const { addUserGroupsToUser } = require("./userGroupController");
const { config } = require("../utils/dbConfig");

// const config = {
//   host: "localhost",
//   user: "root",
//   password: process.env.LOCAL_DB_PASSWORD,
//   database: process.env.LOCAL_DB_DATABASE,
// };
try {
    connection = mysql.createConnection(config);
} catch (err) {
    console.log("something went wrong with connecting to the db", err);
}

const saltRounds = 10;

async function create(req, res, next) {
    const { username, password, email, isActive, userGroups } = req.body;

    // Check if username exists
    const user = await getUser(username);
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

    const createdUser = await createUser(username, hashedPassword, email, isActive);

    // // Add the groups to the user
    if (userGroups) {
        const createdGroups = await addUserGroupsToUser(username, userGroups);
    }

    res.send({
        success: true,
    });
}

async function getCurrentUserDetails(req, res, next) {
    // isAuthenticatedUser middleware must fire before this
    if (!req.user.isActive) {
        return res.send({
            success: false,
            message: "User status is not active",
        });
    }

    let sanitizedUserObj;
    if (req.user) {
        sanitizedUserObj = {
            username: req.user.username,
            isActive: req.user.isActive,
            email: req.user.email,
        };
        res.send({ success: true, data: sanitizedUserObj });
    } else {
        res.send({ success: false });
    }
}

async function allUsers(req, res, next) {
    const users = await allUsersHelper();
    const promiseArr = users.map(async (row) => {
        const userGroups = await getUserGroups(row.username);
        return {
            ...row,
            userGroups: userGroups,
        };
    });

    const resolved = await Promise.all(promiseArr);

    res.send({ success: true, data: resolved });
}

async function update(req, res, next) {
    // Middleware attaches the admin user object to this request.
    // User to update is in request body.

    const { username, password, email, isActive, userGroups } = req.body;

    if (!req.user.isActive) {
        return res.send({
            success: false,
            message: "User status is not active",
        });
    }

    // Check for mega-admin edge case
    if (username === "admin") {
        if (!userGroups.includes("admin")) {
            return res.send({
                success: false,
                message: "Admin role cannot be removed from the Admin user",
            });
        }
    }

    if (password && !isValidPassword(password)) {
        // Check if password pass constraints if request did send a password
        return res.send({
            success: false,
            message: "Password must be 8-10 characters, contain number and special character",
        });
    }

    try {
        const updatedUser = await updateHelper(username, password, email, isActive);

        await deleteAllUserGroupsFromUser(username);
        await addUserGroupsToUser(username, userGroups);

        res.send({
            success: true,
            message: "User updated successfully",
        });
    } catch (e) {
        res.send({
            success: false,
            message: "Failed to update user",
            err: e.message,
        });
    }
}

async function getUser(username) {
    // Returns user object without joins
    const sql = "SELECT * FROM accounts WHERE username = ?";
    return new Promise((resolve, reject) => {
        connection.query(sql, [username], function (e, results, fields) {
            if (e) reject(e);
            resolve(results);
        });
    });
}

async function updateUserProfile(req, res, next) {
    // For profile management page
    const { email, password } = req.body;

    if (password) {
        if (!isValidPassword(password)) {
            res.send({
                success: false,
                message: "Password must be 8-10 char, contain number, character, and special character",
            });
            return;
        }
    }

    let sql;
    let sqlParams = [];
    if (password) {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        sql = "UPDATE accounts SET email=?, password=? WHERE username=?";
        sqlParams.push(email);
        sqlParams.push(hashedPassword);
        sqlParams.push(req.user.username);
    } else {
        sql = "UPDATE accounts SET email=? WHERE username=?";
        sqlParams.push(email);
        sqlParams.push(req.user.username);
    }

    connection.query(sql, sqlParams, (err, result) => {
        if (err) {
            res.status(403).send({ success: false, message: "Bad request" });
        } else {
            res.send({
                success: true,
                result: result,
            });
        }
    });
}

// This method
async function getCompleteUser(username) {
    // This method returns a complete user object with all the usergroups etc.

    try {
        var user = await getUser(username);
    } catch (err) {
        throw err;
    }
    try {
        var groups = await getUserGroups(username);
    } catch (err) {
        throw err;
    }

    user[0].userGroups = groups;

    return user;
}

async function deleteAllUserGroupsFromUser(username) {
    const sql = "DELETE FROM username_usergroup_pivot WHERE username = ?";
    const promise = new Promise((resolve, reject) => {
        connection.query(sql, [username], function (err, results) {
            if (err) reject(err);
            resolve(results);
        });
    });
}

async function updateHelper(username, password, email, isActive) {
    if (password) {
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const sql = "UPDATE accounts SET password=?, email=?, isActive=? WHERE username=?";

        return new Promise((resolve, reject) => {
            connection.query(sql, [hashedPassword, email, isActive, username], function (err, results, fields) {
                if (err) reject(err);
                resolve(results);
            });
        });
    } else {
        const sql = "UPDATE accounts SET email=?, isActive=? WHERE username=?";

        return new Promise((resolve, reject) => {
            connection.query(sql, [email, isActive, username], function (err, results, fields) {
                if (err) reject(err);
                resolve(results);
            });
        });
    }
}

async function getUserGroups(username) {
    // Returns array of user groups that belong to a username
    const sql = "SELECT * FROM username_usergroup_pivot WHERE username=?";
    return new Promise((resolve, reject) => {
        connection.query(sql, [username], function (err, results, fields) {
            if (err) reject(er);
            // resolve(results);

            const groups = results.map((record) => record.usergroup);
            resolve(groups);
        });
    });
}

async function allUsersHelper() {
    const sql = "SELECT username, email, isActive FROM ACCOUNTS";
    let userList = [];
    return new Promise((resolve, reject) => {
        connection.query(sql, [], function (err, results, fields) {
            if (err) reject(err);
            resolve(results);
        });
    });
}

async function createUser(username, hashedPassword, email, isActive) {
    const sql = "INSERT INTO accounts (username, password, email, isActive) VALUES (?, ?, ?, ?);";

    return new Promise((resolve, reject) => {
        connection.query(sql, [username, hashedPassword, email, isActive], function (err, result, fields) {
            if (err) {
                reject(err);
            }
            resolve(result);
        });
    });
}

module.exports = {
    create,
    getCompleteUser,
    getCurrentUserDetails,
    allUsers,
    update,
    getUserGroups,
    updateUserProfile,
};
