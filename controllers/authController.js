const jwt = require("jsonwebtoken");
const { sendToken } = require("../utils/jwtToken");
const bcrypt = require("bcryptjs");
const mysql = require("mysql");
const { USER_GROUPS } = require("../utils/userGroups");
const { isValidPassword } = require("../utils/auth");
const { getUserFromUsername } = require("./userController");
const config = {
  host: "localhost",
  user: "root",
  password: process.env.LOCAL_DB_PASSWORD,
  database: process.env.LOCAL_DB_DATABASE,
};

connection = mysql.createConnection(config);

const saltRounds = 10;

async function addUserToDb(username, hashedPassword, email) {
  const sql =
    "INSERT INTO accounts (username, password, email, userGroup, isActive) VALUES (?, ?, ?, ?, ?)";
  const userGroup = USER_GROUPS.user;
  const isActive = 1;

  return new Promise((resolve, reject) => {
    connection.query(
      sql,
      [username, hashedPassword, email, userGroup, isActive],
      function (err, result, fields) {
        if (err) {
          reject(err);
        }
        resolve(result);
      }
    );
  });
}

async function login(req, res, next) {
  const { username, password } = req.body;

  try {
    const user = await getUserFromUsername(username);
    const isValidCredentials = await bcrypt.compare(password, user[0].password);

    if (!isValidCredentials) {
      return res.send({
        success: false,
        message: "Invalid username or password",
      });
    }

    if (!user[0].isActive) {
      return res.send({
        success: false,
        message: "User is not active. Please contact admin.",
      });
    }

    // Generate JWT with userid, username, user group
    const token = jwt.sign(
      {
        username: user[0].username,
        userGroup: user[0].userGroup,
      },
      process.env.JWT_SECRET
    );

    // Send token to FE in response
    res.status(200).send({
      success: true,
      token: token,
      userGroup: user[0].userGroup,
    });
  } catch {
    res.send({
      success: false,
      message: "Invalid username or password",
    });
  }
}

async function register(req, res, next) {
  const { username, password, email } = req.body;

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

  const result = await addUserToDb(username, hashedPassword, email);

  res.status(200).send({
    success: true,
    result,
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
    return res.status(401).send({
      success: false,
      message: "You are not authorized to access this resource",
    });
  }
}

async function CheckGroup(userid, groupname) {
  const user = await getUserFromUsername(userid);
  if (user.length === 0) return false;
  if (user[0].userGroup === groupname) {
    return true;
  }
  return false;
}

module.exports = { login, checkUserGroup };
