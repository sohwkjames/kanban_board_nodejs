const jwt = require("jsonwebtoken");
const mysql = require("mysql");
const { isValidPassword } = require("../utils/auth");
const { config } = require("../utils/dbConfig");
const { getRNumber, incrementRNumber } = require("./applicationController");
const { checkUserCanPerformAction } = require("./authController");
const {
  TASK_STATES,
  TASK_RANKS,
  ACTION_PERMISSION_COLUMNS,
} = require("../constants/taskState");
const { createNoteString, noteStringToArr } = require("../utils/notes");
const dayjs = require("dayjs");
const { DATETIME_FORMAT } = require("../constants/timeFormat");
const { generateMailOptions, transporter } = require("../utils/email");

connection = mysql.createConnection(config);

async function create(req, res, next) {
  const { taskName, taskDescription, taskPlan, appAcronym, taskNote } =
    req.body;

  const isValidPermissions = await checkUserCanPerformAction(
    appAcronym,
    req.user.username,
    "App_permit_create"
  );

  if (!isValidPermissions) {
    return res.send({
      success: false,
      message: "You do not have permission to access this resource.",
    });
  }

  try {
    const rNumber = await new Promise((resolve, reject) => {
      let sql = "SELECT App_rnumber FROM application WHERE App_Acronym = ?";
      connection.query(sql, [appAcronym], (err, result) => {
        if (err) reject(err);
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

async function getTask(req, res, next) {
  const taskId = req.params.taskId;

  const sql = "SELECT * FROM task WHERE Task_id = ?";
  const result = await new Promise((resolve, reject) => {
    connection.query(sql, [taskId], (err, result) => {
      if (err) reject(err);
      else {
        resolve(result);
      }
    });
  });

  if (result) {
    const formattedResults = result.map((record) => {
      let notes = noteStringToArr(record.Task_notes);
      const newObj = { ...record, Task_notes: notes };
      return newObj;
    });

    res.send({
      success: true,
      data: formattedResults,
    });
  }
}

async function getTaskByApp(req, res, next) {
  const { appAcronym } = req.body;

  // const sql = "SELECT * FROM task WHERE Task_app_acronym = ?";
  const sql = `SELECT * FROM task 
  LEFT JOIN plan ON task.Task_plan = plan.Plan_mvp_name 
  WHERE task.Task_app_acronym = ?`;

  const result = await new Promise((resolve, reject) => {
    connection.query(sql, [appAcronym], (err, result) => {
      if (err) reject(err);
      else {
        resolve(result);
      }
    });
  });

  const formattedResults = result.map((record) => {
    let notes = noteStringToArr(record.Task_notes);
    const newObj = { ...record, Task_notes: notes };
    return newObj;
  });

  if (result) {
    res.send({
      success: true,
      data: formattedResults,
    });
  }
}

async function getTaskByPlan(req, res, next) {
  const { appAcronym, planName } = req.body;

  // const sql = "SELECT * FROM task WHERE Task_app_acronym = ? AND Task_plan = ?";
  const sql = `SELECT * FROM task LEFT JOIN plan ON task.Task_plan = plan.Plan_mvp_name AND task.Task_app_acronym = plan.Plan_app_acronym WHERE task.Task_app_acronym = ? AND task.Task_plan = ?`;

  const result = await new Promise((resolve, reject) => {
    connection.query(sql, [appAcronym, planName], (err, result) => {
      if (err) reject(err);
      else {
        resolve(result);
      }
    });
  });

  const formattedResults = result.map((record) => {
    let notes = noteStringToArr(record.Task_notes);
    const newObj = { ...record, Task_notes: notes };
    return newObj;
  });

  if (result) {
    res.send({
      success: true,
      data: formattedResults,
    });
  }
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
  // Get the application name
  const appAcronym = taskObj.Task_app_acronym;

  const isActionAllowed = await checkUserCanPerformAction(
    appAcronym,
    req.user.username,
    ACTION_PERMISSION_COLUMNS[taskState]
  );

  if (!isActionAllowed) {
    return res.send({
      success: false,
      message: "You do not have permission to access this resource",
    });
  }

  // System generated note string
  let taskNoteString = createNoteString(
    "System",
    taskState,
    `${req.user.username} has taken ownership of the task`
  );

  // User generated note string
  if (taskNote) {
    taskNoteString += createNoteString(req.user.username, taskState, taskNote);
  }
  // Update task owner, concat task note string

  console.log("james2", taskNote);
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

  const taskState = taskObj.Task_state;
  const newTaskState = TASK_RANKS[taskObj.Task_state].promoted;
  const appAcronym = taskObj.Task_app_acronym;

  const isActionAllowed = await checkUserCanPerformAction(
    appAcronym,
    req.user.username,
    ACTION_PERMISSION_COLUMNS[taskState]
  );

  if (!isActionAllowed) {
    return res.send({
      success: false,
      message: "You do not have permission to access this resource",
    });
  }

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
    "UPDATE task SET Task_name=?, Task_description=?, Task_plan=?, Task_owner=?, Task_state=?, Task_notes=CONCAT(Task_notes,?) WHERE Task_id=?";
  const result = await new Promise((resolve, reject) => {
    connection.query(
      sql,
      [
        taskName,
        taskDescription,
        taskPlan,
        req.user.username,
        newTaskState,
        taskNoteString,
        taskId,
      ],
      (err, result) => {
        if (err) reject(err);
        if (result) {
          resolve(result);
        }
      }
    );
  });

  if (newTaskState === "done") {
    // Get all the email receipients
    const sql = `SELECT p.username, accounts.email 
    FROM username_usergroup_pivot AS p 
    LEFT JOIN application
    ON p.usergroup = application.App_permit_done
    LEFT JOIN accounts
    ON p.username = accounts.username
    WHERE application.App_Acronym='facebook';`;
    const emailsArr = await new Promise((resolve, reject) => {
      connection.query(sql, [appAcronym], (err, result) => {
        if (err) reject(err);
        const tmp = result.map((row) => row.email);
        const filtered = tmp.filter((name) => name !== null);
        const string = filtered.join(",");
        resolve(filtered);
      });
    });

    sendEmailNotification(emailsArr, taskId);
  }

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

  const taskState = taskObj.Task_state;
  const appAcronym = taskObj.Task_app_acronym;
  const newTaskState = TASK_RANKS[taskObj.Task_state].demoted;

  const isActionAllowed = await checkUserCanPerformAction(
    appAcronym,
    req.user.username,
    ACTION_PERMISSION_COLUMNS[taskState]
  );

  if (!isActionAllowed) {
    return res.send({
      success: false,
      message: "You do not have permission to access this resource",
    });
  }

  // System generated note string
  let taskNoteString = createNoteString(
    "System",
    newTaskState,
    `${req.user.username} has demoted the task to ${newTaskState}`
  );

  console.log("james1", taskNoteString);
  // User generated note string
  if (taskNote) {
    taskNoteString += createNoteString(
      req.user.username,
      newTaskState,
      taskNote
    );
  }

  console.log("james2", taskNoteString);

  if (!newTaskState) {
    return res.send({
      success: false,
      message: "Unable to demote this task further.",
    });
  }

  const sql =
    "UPDATE task SET Task_name=?, Task_description=?, Task_plan=?, Task_owner=?, Task_state=?, Task_notes=CONCAT(Task_notes,?) WHERE Task_id=?";
  const result = await new Promise((resolve, reject) => {
    connection.query(
      sql,
      [
        taskName,
        taskDescription,
        taskPlan,
        req.user.username,
        newTaskState,
        taskNoteString,
        taskId,
      ],
      (err, result) => {
        if (err) reject(err);
        if (result) {
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

async function sendEmailNotification(emailString, taskId) {
  const mailOptions = generateMailOptions(emailString, taskId);

  const result = await new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) reject(err);
      if (info) resolve(info);
    });
  });

  console.log("Send email result", result);

  return result;
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
