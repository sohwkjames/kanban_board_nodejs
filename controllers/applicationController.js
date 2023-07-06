const jwt = require("jsonwebtoken");
const mysql = require("mysql");
const { isValidPassword } = require("../utils/auth");
const { config } = require("../utils/dbConfig");

// const config = {
//   host: "localhost",
//   user: "root",
//   password: process.env.LOCAL_DB_PASSWORD,
//   database: process.env.LOCAL_DB_DATABASE,
// };

connection = mysql.createConnection(config);

async function create(req, res, next) {
  const {
    appAcronym,
    appRnumber,
    appDescription,
    appStartdate,
    appEnddate,
    appPermitOpen,
    appPermitTodolist,
    appPermitDoing,
    appPermitDone,
  } = req.body;

  if (!appAcronym || !appRnumber || !appStartdate || !appEnddate) {
    return res.send({
      success: false,
      message:
        "App acronym, app running number, app start date and app end date cannot be empty",
    });
  }

  if (appStartdate > appEnddate) {
    return res.send({
      success: false,
      message: "Start date cannot be after end date",
    });
  }

  const appNameExists = await new Promise((resolve, reject) => {
    const sql =
      "SELECT COUNT(App_Acronym) AS count FROM application WHERE App_Acronym = ?";
    connection.query(sql, appAcronym, (err, result) => {
      console.log("Result", result);
      resolve(result[0].count);
    });
  });
  console.log("appNameExist", appNameExists);
  if (appNameExists) {
    return res.send({
      sucess: false,
      message: "App acronym already exists, please choose a different one",
    });
  }

  const sql = `INSERT INTO application
    (App_Acronym, App_rnumber, App_description, App_startdate, App_enddate, App_permit_open, App_permit_todolist, App_permit_doing, App_permit_done)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  connection.query(
    sql,
    [
      appAcronym,
      appRnumber,
      appDescription,
      appStartdate,
      appEnddate,
      appPermitOpen,
      appPermitTodolist,
      appPermitDoing,
      appPermitDone,
    ],
    (err, result) => {
      if (err) {
        console.log("err", err);
        return res.send({
          success: false,
          message: "Failed to add application",
        });
      } else {
        return res.send({
          success: true,
          message: "Application added",
        });
      }
    }
  );
}

async function getAll(req, res, next) {
  const sql = "SELECT * FROM application";
  connection.query(sql, [], (err, result) => {
    if (err) {
      return res.send({
        success: false,
        message: err,
      });
    }
    return res.send({
      success: true,
      data: result,
    });
  });
}

async function getOne(req, res, next) {
  // console.log("req.params", req.params);
  const sql = "SELECT * FROM application WHERE App_Acronym = ?";
  connection.query(sql, [req.params.appAcronym], (err, result) => {
    if (err) {
      return res.send({
        success: false,
        message: err,
      });
    }
    return res.send({
      success: true,
      data: result,
    });
  });
}

// --- Helper functions ---
async function getRNumber(appAcronym) {
  const sql = "SELECT App_rnumber FROM application WHERE App_Acronym = ?";
  return new Promise((resolve, reject) => {
    connection.query(sql, [appAcronym], (err, result) => {
      if (err) reject(err);
      if (result.length) {
        resolve(result[0].App_rnumber);
      }
    });
  });
}

async function incrementRNumber(appAcronym) {
  const sql = "SELECT App_rnumber FROM application WHERE App_Acronym = ?";
  return new Promise((resolve, reject) => {
    connection.query(sql, [appAcronym], (err, result) => {
      if (err) reject(err);
      if (result.length) {
        const incrementedRNumber = result[0].App_rnumber + 1;
        // Query again
        const sql =
          "UPDATE application SET App_rnumber = ? WHERE App_Acronym = ?";
        connection.query(
          sql,
          [incrementedRNumber, appAcronym],
          (err, result) => {
            if (err) reject(err);
            if (result) {
              resolve(true);
            }
          }
        );
      }
    });
  });
}

module.exports = { create, getAll, getOne, getRNumber, incrementRNumber };
