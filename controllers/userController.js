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

  console.log("result is", result);

  res.status(200).send({
    success: true,
    result,
  });
}

module.exports = { register, getUserFromUsername };
