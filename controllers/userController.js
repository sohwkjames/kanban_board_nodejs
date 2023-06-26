const jwt = require("jsonwebtoken");
const { sendToken } = require("../utils/jwtToken");
const bcrypt = require("bcryptjs");
const mysql = require("mysql");
const { USER_GROUPS } = require("../utils/userGroups");
const { isValidPassword } = require("../utils/auth");

const config = {
  host: "localhost",
  user: "root",
  password: process.env.LOCAL_DB_PASSWORD,
  database: process.env.LOCAL_DB_DATABASE,
};

connection = mysql.createConnection(config);

const saltRounds = 10;

async function getUserFromUsername(username) {
  const sql = "SELECT * FROM accounts WHERE username = ?";
  return new Promise((resolve, reject) => {
    connection.query(sql, [username], function (err, results, fields) {
      if (err) {
        reject(err);
      }
      resolve(results);
    });
  });
}

async function getAllUsers() {
  const sql = "SELECT username, userGroup, email, isActive FROM ACCOUNTS";
  return new Promise((resolve, reject) => {
    connection.query(sql, [], function (err, results, fields) {
      if (err) reject(err);
      resolve(results);
    });
  });
}

async function createUser(
  username,
  hashedPassword,
  email,
  isActive,
  userGroup
) {
  const sql =
    "INSERT INTO accounts (username, password, email, isActive, userGroup) VALUES (?, ?, ?, ?, ?)";

  return new Promise((resolve, reject) => {
    connection.query(
      sql,
      [username, hashedPassword, email, isActive, userGroup],
      function (err, result, fields) {
        if (err) {
          reject(err);
        }
        resolve(result);
      }
    );
  });
}

async function register(req, res, next) {
  const { username, password, email, isActive, userGroup } = req.body;

  console.log("params are", isActive, userGroup);
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
      message:
        "Password must be 8-10 characters, contain at least 1 number, at least 1 character, and at least 1 special character.",
    });
  }

  const hashedPassword = await bcrypt.hash(password, saltRounds);

  console.log("userController awaiting write to db");

  const result = await createUser(
    username,
    hashedPassword,
    email,
    isActive,
    userGroup
  );

  res.status(200).send({
    success: true,
    result,
  });
}

async function getCurrentUserDetails(req, res, next) {
  // isAuthenticatedUser middleware must fire before this
  if (req.user) {
    const sanitizedUserObj = {
      username: req.user.username,
      isActive: req.user.isActive,
      userGroup: req.user.userGroup,
      email: req.user.email,
    };
    res.send({ success: true, data: sanitizedUserObj });
  } else {
    res.send({ success: false });
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

async function allUsers(req, res, next) {
  const users = await getAllUsers();
  res.send({ success: true, data: users });
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

module.exports = {
  register,
  getUserFromUsername,
  getCurrentUserDetails,
  allUsers,
  update,
};
