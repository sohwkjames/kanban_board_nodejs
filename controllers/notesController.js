const mysql = require("mysql");
const { config } = require("../utils/dbConfig");

const connection = mysql.createConnection(config);

async function addNote(req, res, next) {}

async function addNotes(req, res, next) {}

async function getNotes(req, res, next) {}

module.exports = {
  create,
  getCompleteUser,
  getCurrentUserDetails,
  allUsers,
  update,
  getUserGroups,
  updateUserProfile,
};
