const jwt = require("jsonwebtoken");
const mysql = require("mysql");
const { isValidPassword } = require("../utils/auth");
const { config } = require("../utils/dbConfig");
const { getRNumber, incrementRNumber } = require("./applicationController");
const { checkUserCanPerformAction } = require("./authController");

connection = mysql.createConnection(config);

async function create(req, res, next) {
  const {
    taskName,
    taskDescription,
    taskPlan,
    taskAppAcronym,
    taskState,
    taskCreator,
    taskOwner,
    taskCreatedate,
    taskNotes,
  } = req.body;

  console.log("task notes", taskNotes);

  const isValidPermissions = await checkUserCanPerformAction(
    taskAppAcronym,
    req.user.username,
    "App_permit_create"
  );

  if (!isValidPermissions) {
    res.send({
      success: false,
      message: "You do not have permission to access this resource.",
    });
  }

  try {
    const rNumber = await new Promise((resolve, reject) => {
      let sql = "SELECT App_rnumber FROM application WHERE App_Acronym = ?";
      connection.query(sql, [taskAppAcronym], (err, result) => {
        if (err) reject(err);
        resolve(result[0].App_rnumber);
      });
    });

    const taskId = taskAppAcronym + "_" + rNumber;

    const createdTask = await new Promise((resolve, reject) => {
      const sql = `INSERT INTO task
      (Task_id, Task_name, Task_description, Task_plan, Task_app_acronym, Task_state, Task_creator, Task_owner, Task_createDate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
      connection.query(
        sql,
        [
          taskId,
          taskName,
          taskDescription,
          taskPlan,
          taskAppAcronym,
          taskState,
          taskCreator,
          taskOwner,
          taskCreatedate,
        ],
        (err, results) => {
          if (err) reject(err);
          resolve({
            taskId,
            taskName,
            taskDescription,
            taskPlan,
            taskAppAcronym,
            taskState,
            taskCreator,
            taskOwner,
            taskCreatedate,
          });
        }
      );
    });

    const incrementedRNumber = rNumber + 1;

    await new Promise((resolve, reject) => {
      const sql = "UPDATE application SET App_rnumber= ? WHERE App_Acronym = ?";
      connection.query(
        sql,
        [incrementedRNumber, taskAppAcronym],
        (err, results) => {
          if (err) reject(err);
          resolve(results);
        }
      );
    });

    res.send({
      success: true,
    });
  } catch (e) {
    res.send({ success: false, message: e });
  }
}

async function createTaskHelper(
  taskId,
  taskName,
  taskDescription,
  taskPlan,
  taskAppAcronym,
  taskState,
  taskCreator,
  taskOwner,
  taskCreatedate
) {
  const sql = `INSERT INTO task 
  (Task_id, Task_name, Task_description, Task_plan, Task_app_acronym, Task_state, Task_creator, Task_owner, Task_createDate)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  return new Promise((resolve, reject) => {
    connection.query(
      sql,
      [
        taskId,
        taskName,
        taskDescription,
        taskPlan,
        taskAppAcronym,
        taskState,
        taskCreator,
        taskOwner,
        taskCreatedate,
      ],
      (err, results) => {
        if (err) {
          reject("Failed to create task");
        }
        resolve({
          taskId,
          taskName,
          taskDescription,
          taskPlan,
          taskAppAcronym,
          taskState,
          taskCreator,
          taskOwner,
          taskCreatedate,
        });
      }
    );
  });
}

module.exports = { create };
