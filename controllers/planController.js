const mysql = require("mysql");
const { config } = require("../utils/dbConfig");

const connection = mysql.createConnection(config);

async function create(req, res, next) {
  const { planMvpName, planAppAcronym, planStartdate, planEnddate } = req.body;

  // Check if planMvpName + app acronym is taken
  const planNameExists = await new Promise((resolve, reject) => {
    const sql =
      "SELECT * FROM plan WHERE Plan_mvp_name = ? AND Plan_app_acronym = ? ";
    connection.query(sql, [planMvpName, planAppAcronym], (err, result) => {
      if (err) reject(err);
      if (result.length) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });

  if (planNameExists) {
    return res.send({
      success: false,
      message:
        "Plan name already exists for this app, please choose a different plan name",
    });
  }

  // Check if app acronym exist
  const appAcronymExists = await new Promise((resolve, reject) => {
    const sql = "SELECT * FROM application WHERE App_Acronym = ?";
    connection.query(sql, [planAppAcronym], (err, result) => {
      if (err) reject(err);
      console.log("james", result);
      if (result.length) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });

  if (!appAcronymExists) {
    return res.send({
      success: false,
      message:
        "This app name does not exist yet. Please create the the app first before adding a plan.",
    });
  }

  // Add to table
  const sql =
    "INSERT INTO plan (Plan_mvp_name, Plan_startdate, Plan_enddate, Plan_app_acronym) VALUES (?, ?, ?, ?)";
  const insertResult = await new Promise((resolve, reject) => {
    connection.query(
      sql,
      [planMvpName, planStartdate, planEnddate, planAppAcronym],
      (err, result) => {
        if (err) {
          reject(err);
        }
        resolve(result);
      }
    );
  });

  if (insertResult) {
    res.send({ success: true, message: "Plan added successfully" });
  }
}

async function getAll(req, res, next) {
  const plans = await new Promise((resolve, reject) => {
    const sql = "SELECT * FROM plan";
    connection.query(sql, [], (err, result) => {
      if (err) reject(err);
      else {
        resolve(result);
      }
    });
  });

  res.send({ success: true, data: plans });
}

async function getByAppAcronym(req, res, next) {
  const { appAcronym } = req.body;
  try {
    const sql = "SELECT * FROM PLAN WHERE Plan_app_acronym = ?";
    const results = await new Promise((resolve, reject) => {
      connection.query(sql, [appAcronym], (err, results) => {
        resolve(results);
      });
    });

    res.send({ success: true, data: results });
  } catch (e) {
    res.send({ success: false, message: "Failed to get plans" });
  }
}

module.exports = { create, getAll, getByAppAcronym };
