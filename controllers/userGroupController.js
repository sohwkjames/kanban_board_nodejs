const jwt = require("jsonwebtoken");
const { sendToken } = require("../utils/jwtToken");
const bcrypt = require("bcryptjs");
const mysql = require("mysql");
const { isValidPassword } = require("../utils/auth");

const config = {
  host: "localhost",
  user: "root",
  password: process.env.LOCAL_DB_PASSWORD,
  database: process.env.LOCAL_DB_DATABASE,
};

connection = mysql.createConnection(config);

const saltRounds = 10;

// Helper function
async function getAllHelper() {
  const sql = "SELECT * FROM usergroups";
  return new Promise((resolve, reject) => {
    connection.query(sql, [], (err, result, fields) => {
      if (err) reject(err);
      resolve(result);
    });
  });
}

async function getAll(req, res, next) {
  try {
    const userGroups = await getAllHelper();
    res.send({
      success: true,
      userGroups: userGroups,
    });
  } catch {
    res.send({
      success: false,
      message: "Something went wrong",
    });
  }
}

async function addHelper(groupName) {
  const sql = "INSERT INTO usergroups (groupname) VALUES (?)";
  return new Promise((resolve, reject) => {
    connection.query(sql, [groupName], (err, result, fields) => {
      if (err) reject(err);
      resolve(result);
    });
  });
}

async function add(req, res, next) {
  const { groupName } = req.body;
  let result;

  try {
    result = await addHelper(groupName);
    return res.send({
      success: true,
      message: "Group added successfully",
      groupName: groupName,
    });
  } catch (err) {
    return res.send({
      success: false,
      message: err.message,
    });
  }
}

async function addUserGroupsToUser(username, groupnames) {
  // Does not check if user already has group
  let values = [];
  if (!groupnames) return;
  groupnames.forEach((name) => values.push([username, name]));
  const sql =
    "INSERT INTO username_usergroup_pivot (username, usergroup) VALUES (?)";
  return new Promise((resolve, reject) => {
    connection.query(sql, values, function (err, results, fields) {
      if (err) reject(err);
      else resolve(results);
    });
  });
}

async function debug() {
  const values = [["user1"]];
  const sql =
    "INSERT INTO username_usergroup_pivot (username, usergroup) VALUES ?";
}

module.exports = { getAll, add, addUserGroupsToUser, debug };
