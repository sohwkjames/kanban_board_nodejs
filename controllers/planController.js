const mysql = require("mysql");
const { config } = require("../utils/dbConfig");
const dayjs = require("dayjs");
const { DATETIME_FORMAT, DATE_FORMAT } = require("../constants/timeFormat");
const { checkUserCanPerformAction } = require("./authController");
const connection = mysql.createConnection(config);

async function create(req, res, next) {
  const { planMvpName, appAcronym, planStartdate, planEnddate, planColour } =
    req.body;

  // Check if user has permission to do this action.
  const actionName = "App_permit_open";
  const isActionAllowed = await checkUserCanPerformAction(
    appAcronym,
    req.user.username,
    actionName
  );

  if (!isActionAllowed) {
    return res.send({
      success: false,
      message: "You do not have permission to perform this action.",
    });
  }

  // Check if planMvpName + app acronym is taken
  const planNameExists = await new Promise((resolve, reject) => {
    const sql =
      "SELECT * FROM plan WHERE Plan_mvp_name = ? AND Plan_app_acronym = ? ";
    connection.query(sql, [planMvpName, appAcronym], (err, result) => {
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
    connection.query(sql, [appAcronym], (err, result) => {
      if (err) reject(err);
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
    "INSERT INTO plan (Plan_mvp_name, Plan_startdate, Plan_enddate, Plan_app_acronym, Plan_colour) VALUES (?, ?, ?, ?, ?)";
  const insertResult = await new Promise((resolve, reject) => {
    connection.query(
      sql,
      [planMvpName, planStartdate, planEnddate, appAcronym, planColour],
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
  const appAcronym = req.params.appAcronym;
  // console.log("appAcronym", appAcronym);

  try {
    const sql = "SELECT * FROM PLAN WHERE Plan_app_acronym = ?";
    const results = await new Promise((resolve, reject) => {
      connection.query(sql, [appAcronym], (err, results) => {
        resolve(results);
      });
    });

    // Format mysql datetime to DATE_FORMAT
    const formattedResults = results.map((record) => {
      return {
        ...record,
        Plan_startdate: dayjs(record.Plan_startdate).format(DATE_FORMAT),
        Plan_enddate: dayjs(record.Plan_enddate).format(DATE_FORMAT),
      };
    });

    res.send({ success: true, data: formattedResults });
  } catch (e) {
    res.send({ success: false, message: "Failed to get plans" });
  }
}

module.exports = { create, getAll, getByAppAcronym };
