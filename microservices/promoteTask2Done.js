const bcrypt = require("bcryptjs");
const { config } = require("../utils/dbConfig");
const mysql = require("mysql");
const dayjs = require("dayjs");
const nodemailer = require("nodemailer");

let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Settings
const saltRounds = 10;
connection = mysql.createConnection(config);

async function promoteTask2Done(req, res, next) {
  const { username, password, taskId, taskNote, appAcronym } = req.body;

  if (!username || !password || !taskId || !appAcronym) {
    return res.status(200).send({
      code: "E003",
    });
  }

  const user = await new Promise((resolve, reject) => {
    const sql = `SELECT * FROM accounts WHERE username=?`;
    connection.query(sql, [username], (err, results) => {
      if (err) reject(err);
      if (results.length) {
        resolve(results[0]);
      } else {
        resolve(false);
      }
    });
  });

  if (!user) {
    return res.status(200).send({
      code: "E004",
    });
  }

  const validPassword = await bcrypt.compare(password, user.password);

  if (!validPassword) {
    return res.status(200).send({
      code: "E004",
    });
  }

  if (user.isActive === 0) {
    return res.status(200).send({
      code: "E001",
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
      code: "E005",
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
      code: "E002",
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
      code: "E009",
    });
  }

  if (taskObj.Task_state !== "doing") {
    return res.status(200).send({
      code: "E010",
    });
  }

  if (taskNote && taskNote !== "") {
    if (taskNote.includes("**") || taskNote.includes("||")) {
      return res.status(200).json({
        code: "E012",
      });
    }
  }

  // System generated note string
  let taskNoteString = createNoteString(
    "System",
    "done",
    `${username} has promoted the task to done`
  );

  if (taskNote) {
    taskNoteString += createNoteString(username, "done", taskNote);
  }

  const newTaskObj = await new Promise((resolve, reject) => {
    const sql =
      "UPDATE task SET Task_state=?, Task_notes=CONCAT(Task_notes,?) WHERE Task_id=?";
    connection.query(sql, ["done", taskNoteString, taskId], (err, results) => {
      if (err) reject(err);
      resolve(results[0]);
    });
  });

  // Handle send emails
  const sql = `SELECT p.username, accounts.email 
  FROM username_usergroup_pivot AS p 
  LEFT JOIN application
  ON p.usergroup = application.App_permit_done
  LEFT JOIN accounts
  ON p.username = accounts.username
  WHERE application.App_Acronym=?`;

  const emailsArr = await new Promise((resolve, reject) => {
    connection.query(sql, [appAcronym], (err, result) => {
      if (err) reject(err);
      const tmp = result.map((row) => row.email);
      const filtered = tmp.filter((name) => name !== null);
      const string = filtered.join(",");
      resolve(filtered);
    });
  });

  try {
    // sendEmailNotification(emailsArr, taskId);
    const mailOptions = generateMailOptions(emailsArr, taskId);

    const result = await new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          reject(err);
        }
        if (info) resolve(info);
      });
    });
  } catch (e) {
    return res.status(200).send({ taskId, code: "S001" });
  }

  return res.status(200).send({
    taskId,
    code: "S001",
  });
}

function createNoteString(username, taskState, noteContent, timeStamp) {
  let noteString = "";
  noteString += username + "**" + taskState + "**" + noteContent + "**";
  if (!timeStamp) {
    noteString += dayjs().format("YYYY-MM-DD HH:mm:ss") + "**";
  }
  noteString += "||";

  return noteString;
}

function noteStringToObj(str) {
  const tmpArr = str.split("**");
  return {
    username: tmpArr[0],
    taskState: tmpArr[1],
    note: tmpArr[2],
    timestamp: tmpArr[3],
  };
}

async function sendEmailNotification(emailString, taskId) {
  const mailOptions = generateMailOptions(emailString, taskId);

  const result = await new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        reject(err);
      }
      if (info) resolve(info);
    });
  });

  return result;
}

const generateMailOptions = (recipientEmails, taskId) => {
  return {
    from: process.env.EMAIL_USERNAME,
    to: recipientEmails.join(", "),
    subject: "A new task is ready for your evaluation",
    html: `A new task ${taskId} is ready for your evaluation.`,
  };
};

module.exports = { promoteTask2Done };
