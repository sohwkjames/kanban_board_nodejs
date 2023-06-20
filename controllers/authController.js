const jwt = require("jsonwebtoken");
const { sendToken } = require("../utils/jwtToken");
const bcrypt = require("bcryptjs");
const mysql = require("mysql");
const { USER_GROUPS } = require("../utils/userGroups");

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
    "INSERT INTO accounts (username, password, email, userGroup) VALUES (?, ?, ?, ?)";
  const userGroup = 1;
  return new Promise((resolve, reject) => {
    connection.query(
      sql,
      [username, hashedPassword, email, userGroup],
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
    console.log("user is", user[0]);
    const isValidCredentials = await bcrypt.compare(password, user[0].password);

    if (!isValidCredentials) {
      return res.send({
        success: false,
        err: "Invalid username or password",
      });
    }

    if (!user[0].isActive) {
      return res.send({
        success: false,
        err: "User is not active. Please contact admin.",
      });
    }

    // Generate JWT with userid, username, user group
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        userGroup: user.userGroup,
      },
      process.env.JWT_SECRET
    );

    // Send token to FE in response
    res.status(200).send({
      success: true,
      token: token,
    });
  } catch {
    res.send({
      success: false,
      err: "Invalid username or password",
    });
  }
}

async function register(req, res, next) {
  const { username, password, email } = req.body;

  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const result = await addUserToDb(username, hashedPassword, email);

  console.log("result is", result);

  res.status(200).send({
    success: true,
    result,
  });
}

module.exports = { login };
