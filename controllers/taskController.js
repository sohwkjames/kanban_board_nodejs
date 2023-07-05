const jwt = require("jsonwebtoken");
const mysql = require("mysql");
const { isValidPassword } = require("../utils/auth");
const { config } = require("../utils/dbConfig");
const { getRNumber, incrementRNumber } = require("./applicationController");

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
  } = req.body;

  try {
    const rNumber = await getRNumber(taskAppAcronym);

    // Insert task into task table
    const taskId = taskAppAcronym + "_" + rNumber;
    const createdTask = await createTaskHelper(
      taskId,
      taskName,
      taskDescription,
      taskPlan,
      taskAppAcronym,
      taskState,
      taskCreator,
      taskOwner,
      taskCreatedate
    );

    const newRNumber = await incrementRNumber(taskAppAcronym);

    return res.send({
      success: true,
      data: createdTask,
    });
  } catch (e) {
    res.send({
      success: false,
      message: e,
    });
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
