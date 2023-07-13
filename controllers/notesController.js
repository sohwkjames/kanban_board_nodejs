const mysql = require("mysql");
const { config } = require("../utils/dbConfig");

const connection = mysql.createConnection(config);

async function addNotes(req, res, next) {
  const { note } = req.body;
  console.log("notes", note);

  if (!note) {
    return res.send({
      success: true,
    });
  }

  const resolved = await addNoteHelper(
    note.taskid,
    req.user.username,
    note.taskState,
    note.timeStamp,
    note.comment
  );

  console.log("resolved", resolved);
  if (resolved) {
    res.send({
      success: true,
    });
  }
}

async function addNoteHelper(taskid, username, taskState, timeStamp, comment) {
  const sql =
    "INSERT INTO notes (taskid, username, taskstate, timestamp, comment) VALUES (?, ?, ?, ?, ?)";
  return new Promise((resolve, reject) => {
    connection.query(
      sql,
      [taskid, username, taskState, timeStamp, comment],
      (err, result) => {
        if (err) reject(err);
        resolve(result);
      }
    );
  });
}

async function getNotes(req, res, next) {}

module.exports = {
  addNotes,
  getNotes,
};
