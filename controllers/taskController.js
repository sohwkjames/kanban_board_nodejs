const jwt = require("jsonwebtoken");
const mysql = require("mysql");
const { isValidPassword } = require("../utils/auth");
const { config } = require("../utils/dbConfig");
const { getRNumber, incrementRNumber } = require("./applicationController");
const { checkUserCanPerformAction } = require("./authController");
const { TASK_STATES, TASK_RANKS } = require("../constants/taskState");
const { createNoteString } = require("../utils/notes");
const dayjs = require("dayjs");
const { DATETIME_FORMAT } = require("../constants/timeFormat");

connection = mysql.createConnection(config);

async function create(req, res, next) {
  const { taskName, taskDescription, taskPlan, appAcronym, taskNote } =
    req.body;

  // const isValidPermissions = await checkUserCanPerformAction(
  //   appAcronym,
  //   req.user.username,
  //   "App_permit_create"
  // );

  // if (!isValidPermissions) {
  //   res.send({
  //     success: false,
  //     message: "You do not have permission to access this resource.",
  //   });
  // }

  try {
    const rNumber = await new Promise((resolve, reject) => {
      let sql = "SELECT App_rnumber FROM application WHERE App_Acronym = ?";
      connection.query(sql, [appAcronym], (err, result) => {
        if (err) reject(err);
        console.log("app rnumber", result);
        resolve(result[0].App_rnumber);
      });
    });

    const taskId = appAcronym + "_" + rNumber;

    // generate task state
    const taskState = TASK_STATES.open;
    // generate task creator
    const taskCreator = req.user.username;
    // generate task owner
    const taskOwner = req.user.username;

    const taskCreateDate = dayjs().format(DATETIME_FORMAT);

    // system generated task note
    let taskNoteString = createNoteString(
      "System",
      "open",
      `${taskOwner} has created the task.`
    );

    // user generated note string
    if (taskNote) {
      taskNoteString += createNoteString(taskOwner, "open", taskNote);
    }

    const createdTask = await new Promise((resolve, reject) => {
      const sql = `INSERT INTO task
      (Task_id, Task_name, Task_description, Task_plan, Task_app_acronym, Task_state, Task_creator, Task_owner, Task_createDate, Task_notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
      connection.query(
        sql,
        [
          taskId,
          taskName,
          taskDescription,
          taskPlan,
          appAcronym,
          taskState,
          taskCreator,
          taskOwner,
          taskCreateDate,
          taskNoteString,
        ],
        (err, results) => {
          if (err) reject(err);
          resolve({
            taskId,
            taskName,
            taskDescription,
            taskPlan,
            appAcronym,
            taskState,
            taskCreator,
            taskOwner,
            taskCreateDate,
            taskNoteString,
          });
        }
      );
    });

    const incrementedRNumber = rNumber + 1;

    await new Promise((resolve, reject) => {
      const sql = "UPDATE application SET App_rnumber= ? WHERE App_Acronym = ?";
      connection.query(
        sql,
        [incrementedRNumber, appAcronym],
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

async function getTaskByApp(req, res, next) {
  const { appAcronym } = req.body;

  const sql = "SELECT * FROM task WHERE Task_app_acronym = ?";
  const result = await new Promise((resolve, reject) => {
    connection.query(sql, [appAcronym], (err, result) => {
      if (err) reject(err);
      else {
        resolve(result);
      }
    });
  });

  if (result) {
    res.send({
      success: true,
      data: result,
    });
  }
}

async function getTask(req, res, next) {
  const taskId = req.params.taskId;
  console.log("taskId", taskId);

  const sql = "SELECT * FROM task WHERE Task_id = ?";
  const result = await new Promise((resolve, reject) => {
    connection.query(sql, [taskId], (err, result) => {
      if (err) reject(err);
      else {
        console.log("Result", result);
        resolve(result);
      }
    });
  });

  if (result) {
    res.send({
      success: true,
      data: result,
    });
  }
}

async function getTaskByPlan(req, res, next) {
  // const { planName } = req.body;
  res.send({ success: true });
}

async function editTask(req, res, next) {
  const { taskId, taskName, taskDescription, taskPlan, taskNote } = req.body;

  // Get current task state
  const taskObj = await new Promise((resolve, reject) => {
    const sql = "SELECT * FROM task WHERE Task_id=?";
    connection.query(sql, [taskId], (err, result) => {
      if (err) reject(err);
      resolve(result[0]);
    });
  });

  const taskState = taskObj.Task_state;
  // System generated note string

  // User generated note string
  const taskNoteString = createNoteString(
    req.user.username,
    taskState,
    taskNote
  );
  // Update task owner, concat task note string

  const sql =
    "UPDATE task SET Task_name=?, Task_description=?, Task_plan=?, Task_owner=?, Task_notes=CONCAT(Task_notes,?) WHERE Task_id=?";
  const result = await new Promise((resolve, reject) => {
    connection.query(
      sql,
      [
        taskName,
        taskDescription,
        taskPlan,
        req.user.username,
        taskNoteString,
        taskId,
      ],
      (err, result) => {
        if (err) reject(err);
        if (result) {
          console.log("result", result);
          resolve(result);
        }
      }
    );
  });
  if (result) {
    res.send({ success: true });
  } else {
    res.send({ success: false });
  }
}

async function editAndPromoteTask(req, res, next) {
  const { taskId, taskName, taskDescription, taskPlan, taskNote } = req.body;
  const taskObj = await new Promise((resolve, reject) => {
    const sql = "SELECT * FROM task WHERE Task_id=?";
    connection.query(sql, [taskId], (err, result) => {
      if (err) reject(err);
      if (result.length) {
        resolve(result[0]);
      }
    });
  });

  const newTaskState = TASK_RANKS[taskObj.Task_state].promoted;

  // System generated note string
  let taskNoteString = createNoteString(
    "System",
    newTaskState,
    `${req.user.username} has promoted the task to ${newTaskState}`
  );

  // User generated note string
  if (taskNote) {
    taskNoteString += createNoteString(
      req.user.username,
      newTaskState,
      taskNote
    );
  }
  if (!newTaskState) {
    res.send({
      success: false,
      message: "Unable to promote this task further.",
    });
  }

  const sql =
    "UPDATE task SET Task_name=?, Task_description=?, Task_plan=?, Task_state=?, Task_notes=CONCAT(Task_notes,?) WHERE Task_id=?";
  const result = await new Promise((resolve, reject) => {
    connection.query(
      sql,
      [
        taskName,
        taskDescription,
        taskPlan,
        newTaskState,
        taskNoteString,
        taskId,
      ],
      (err, result) => {
        if (err) reject(err);
        if (result) {
          console.log("result", result);
          resolve(result);
        }
      }
    );
  });
  if (result) {
    res.send({ success: true });
  } else {
    res.send({ success: false });
  }
}

async function editAndDemoteTask(req, res, next) {
  const { taskId, taskName, taskDescription, taskPlan, taskNote } = req.body;
  const taskObj = await new Promise((resolve, reject) => {
    const sql = "SELECT * FROM task WHERE Task_id=?";
    connection.query(sql, [taskId], (err, result) => {
      if (err) reject(err);
      if (result.length) {
        resolve(result[0]);
      }
    });
  });

  const newTaskState = TASK_RANKS[taskObj.Task_state].demoted;

  // System generated note string
  let taskNoteString = createNoteString(
    "System",
    newTaskState,
    `${req.user.username} has demoted the task to ${newTaskState}`
  );

  // User generated note string
  if (taskNote) {
    taskNoteString += createNoteString(
      req.user.username,
      newTaskState,
      taskNote
    );
  }
  if (!newTaskState) {
    return res.send({
      success: false,
      message: "Unable to demote this task further.",
    });
  }

  const sql =
    "UPDATE task SET Task_name=?, Task_description=?, Task_plan=?, Task_state=?, Task_notes=CONCAT(Task_notes,?) WHERE Task_id=?";
  const result = await new Promise((resolve, reject) => {
    connection.query(
      sql,
      [
        taskName,
        taskDescription,
        taskPlan,
        newTaskState,
        taskNoteString,
        taskId,
      ],
      (err, result) => {
        if (err) reject(err);
        if (result) {
          console.log("result", result);
          resolve(result);
        }
      }
    );
  });
  if (result) {
    res.send({ success: true });
  } else {
    res.send({ success: false });
  }
}

module.exports = {
  create,
  getTaskByApp,
  getTaskByPlan,
  getTask,
  editTask,
  editAndPromoteTask,
  editAndDemoteTask,
};
