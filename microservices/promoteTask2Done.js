const bcrypt = require("bcryptjs");
const { config } = require("../utils/dbConfig");
const mysql = require("mysql");
const { connect } = require("../routes/routes");

// Settings
const saltRounds = 10;
connection = mysql.createConnection(config);

async function promoteTask2Done(req, res, next) {
  const { username, password, taskId, taskNote, appAcronym } = req.body;

  if (!username || !password || !taskId || !appAcronym) {
    return res.status(200).send({
      code: "Mandatory parameters are missing",
    });
  }

  const user = await new Promise((resolve, reject) => {
    const sql = `SELECT * FROM accounts WHERE username=?`;
    connection.query(sql, [username], (err, results) => {
      if (err) reject(err);
      console.log("james", results);
      if (results.length) {
        console.log("james", results);
        resolve(results[0]);
      } else {
        resolve(false);
      }
    });
  });

  if (!user) {
    return res.status(200).send({
      code: "Invalid credential",
    });
  }

  const validPassword = await bcrypt.compare(password, user.password);

  if (!validPassword) {
    return res.status(200).send({
      code: "Invalid credential",
    });
  }

  if (user.isActive === 0) {
    return res.status(200).send({
      code: "Inactive user",
    });
  }

  const userGroupsArr = await new Promise((resolve, reject) => {
    const sql =
      "SELECT usergroup FROM username_usergroup_pivot WHERE username = ? ";
    connection.query(sql, [user.username], (err, results) => {
      if (err) reject(err);
      const tmpArr = results.map((record) => record.usergroup);
      resolve(tmpArr);
    });
  });

  const isAppValid = await new Promise((resolve, reject) => {
    const sql = "SELECT * FROM application WHERE App_Acronym = ?";
    connection.query(sql, [appAcronym], (err, results) => {
      if (err) reject(err);
      if (results.length === 0) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });

  if (!isAppValid) {
    return res.status(200).send({
      code: "Invalid app acronym",
    });
  }

  const appObject = await new Promise((resolve, reject) => {
    const sql = "SELECT * FROM application WHERE App_Acronym = ?";
    connection.query(sql, [appAcronym], (err, results) => {
      if (err) reject(err);
      resolve(results[0]);
    });
  });

  // Compare userGroupsArr vs application app_premit_doing group
  if (!userGroupsArr.includes(appObject.App_permit_doing)) {
    return res.status(200).send({
      code: "You do not have permission to perform this action",
    });
  }

  const taskObj = await new Promise((resolve, reject) => {
    const sql = "SELECT * FROM task WHERE Task_id = ?";
    connection.query(sql, [taskId], (err, results) => {
      if (err) reject(err);
      resolve(results[0]);
    });
  });

  if (!taskObj) {
    return res.status(200).send({
      code: "Invalid task id",
    });
  }

  if (taskObj.Task_state !== "doing") {
    return res.status(200).send({
      code: "Task is not at doing state",
    });
  }

  const newTaskObj = await new Promise((resolve, reject) => {
    const sql = "UPDATE task SET Task_state=? WHERE Task_id=?";
    connection.query(sql, ["done", taskId], (err, results) => {
      if (err) reject(err);
      resolve(results[0]);
    });
  });

  return res.status(200).send({
    taskId,
    code: "Successfully promoted task to done",
  });
}

module.exports = { promoteTask2Done };
