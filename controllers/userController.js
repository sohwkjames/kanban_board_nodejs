const jwt = require("jsonwebtoken");
const { sendToken } = require("../utils/jwtToken");
const bcrypt = require("bcryptjs");
const mysql = require("mysql");
const { USER_GROUPS } = require("../utils/userGroups");
const { isValidPassword } = require("../utils/auth");
const { addUserGroupsToUser } = require("./userGroupController");

const config = {
  host: "localhost",
  user: "root",
  password: process.env.LOCAL_DB_PASSWORD,
  database: process.env.LOCAL_DB_DATABASE,
};

connection = mysql.createConnection(config);

const saltRounds = 10;

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

// This method
async function getCompleteUser(username) {
  // This method returns a complete user object with all the usergroups etc.

  const user = await getUser(username);
  const groups = await getUserGroups(username);
  user[0].userGroups = groups;

  return user;
}

async function getAllUsers() {
  const sql = "SELECT username, email, isActive FROM ACCOUNTS";
  let userList = [];
  return new Promise((resolve, reject) => {
    connection.query(sql, [], function (err, results, fields) {
      if (err) reject(err);
      console.log("Results", results);
      results.forEach((user) => console.log("Working on ", user.username));
      // resolve(results);
    });
  });
}

async function createUser(username, hashedPassword, email, isActive) {
  const sql =
    "INSERT INTO accounts (username, password, email, isActive) VALUES (?, ?, ?, ?);";

  return new Promise((resolve, reject) => {
    connection.query(
      sql,
      [username, hashedPassword, email, isActive],
      function (err, result, fields) {
        if (err) {
          reject(err);
        }
        resolve(result);
      }
    );
  });
}

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
      message:
        "Password must be 8-10 characters, contain at least 1 number, at least 1 character, and at least 1 special character.",
    });
  }

  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const createdUser = await createUser(
    username,
    hashedPassword,
    email,
    isActive
  );

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
  // const users = await getAllUsers();
  let userArr = [];
  const sql = "SELECT username, email, isActive FROM ACCOUNTS";
  connection.query(sql, [], function (err, users, fields) {
    if (err) reject(err);
    users.forEach(async (user) => {
      const sql =
        "SELECT usergroup FROM username_usergroup_pivot WHERE username = ?";
      connection.query(
        sql,
        [user.username],
        function (err, userGroups, fields) {
          console.log(
            "Working on",
            user.username,
            "usergroups are:",
            userGroups
          );
        }
      );
      // console.log("Working on ", user);
      // connection.query();
    });
  });

  // res.send({ success: true, data: users });
}

async function update(req, res, next) {
  // Middleware attaches the admin user object to this request.
  // User to update is in request body.
  const { username, password, email, isActive, userGroup } = req.body;

  // Check if password pass constraints
  if (!isValidPassword(password)) {
    return res.send({
      success: false,
      message:
        "Password must be 8-10 characters, contain number and special character",
    });
  }
  // Hash the password
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // send update sql
  try {
    const result = await updateHelper(
      username,
      hashedPassword,
      email,
      isActive,
      userGroup
    );

    res.send({ success: true, result, message: "User updated successfully" });
  } catch {
    res.send({ success: false, message: "Failed to update user" });
  }
}

async function updateHelper(
  username,
  hashedPassword,
  email,
  isActive,
  userGroup
) {
  const sql =
    "UPDATE accounts SET password=?, email=?, isActive=?, userGroup=? WHERE username=?";

  return new Promise((resolve, reject) => {
    connection.query(
      sql,
      [hashedPassword, email, isActive, userGroup, username],
      function (err, results, fields) {
        if (err) reject(err);
        resolve(results);
      }
    );
  });
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

module.exports = {
  create,
  getCompleteUser,
  getCurrentUserDetails,
  allUsers,
  update,
  getUserGroups,
};
