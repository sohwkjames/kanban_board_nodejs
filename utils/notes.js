const dayjs = require("dayjs");
const { DATETIME_FORMAT } = require("../constants/timeFormat");

// Sample note string: james**open**this is my note content**12-31-2022**||kenny**todo**this is the second note content**12-31-2022**||lee**doing**1-1-2023**||
// Each ** indicates end of a note variable. There are 4 variables, username, taskState, noteContent, timeStamp
// Each || indicates end of a note.
// `james**open**this is my note content**12-31-2022**||kenny**todo**this is the second note content**12-31-2022**||lee**doing**1-1-2023**||`;

function createNoteString(username, taskState, noteContent, timeStamp) {
  let noteString = "";
  noteString += username + "**" + taskState + "**" + noteContent + "**";
  if (!timeStamp) {
    noteString += dayjs().format(DATETIME_FORMAT) + "**";
  }
  noteString += "||";

  return noteString;
}

module.exports = { createNoteString };
