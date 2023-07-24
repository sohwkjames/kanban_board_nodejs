const jwt = require("jsonwebtoken");
const mysql = require("mysql");
const { isValidPassword } = require("../utils/auth");
const { config } = require("../utils/dbConfig");
const { getRNumber, incrementRNumber } = require("../controllers/applicationController");
const { checkUserCanPerformAction } = require("../controllers/authController");
const { TASK_STATES, TASK_RANKS, ACTION_PERMISSION_COLUMNS } = require("../constants/taskState");
const { createNoteString, noteStringToArr } = require("../utils/notes");
const dayjs = require("dayjs");
const { DATETIME_FORMAT } = require("../constants/timeFormat");
const { generateMailOptions, transporter } = require("../utils/email");
const { getCompleteUser } = require("../controllers/userController");
const bcrypt = require("bcryptjs");

module.exports.createTask = async function create(req, res, next) {
    const { username, password, taskAppAcronym, taskName, taskPlan, taskNote, taskDescription } = req.body;
    // for username and password validation
    if (!username || !password || password === "") {
        return res.status(200).json({
            code: "username or password is empty",
        });
    }
    try {
        var user = await getCompleteUser(username);
    } catch (err) {
        return res.status(200).json({
            code: "user does not exist",
        });
    }

    const isValidCredentials = await bcrypt.compare(password, user[0].password);

    if (!isValidCredentials) {
        return res.status(200).json({
            code: "password is incorrect",
        });
    }

    //check if user is suspended
    if (user[0].isActive == 0) {
        return res.status(200).json({
            code: "user suspended",
        });
    }

    //check if taskname is valid
    if (!taskName || taskName === "") {
        return res.status(200).json({
            code: "taskName is empty",
        });
    }

    if (!taskAppAcronym || taskAppAcronym === "") {
        return res.status(200).json({
            code: "taskAppAcronym is empty",
        });
    }

    if (!plan || plan != "") {
        var plan = await new Promise((resolve, reject) => {
            const sql = `SELECT COUNT('Plan_mvp_name') AS count FROM plan WHERE Plan_mvp_name = ?`;
            connection.query(sql, [taskPlan], async (err, results) => {
                if (err) reject(err);

                resolve({
                    results,
                });
            });
        });

        if (plan.results[0].count === 0) {
            return res.status(200).json({
                code: "Plan provided does not exist",
            });
        }
    }

    // check if user can create task
    try {
        const isValidPermissions = await checkUserCanPerformAction(taskAppAcronym, username, "App_permit_create");

        if (!isValidPermissions) {
            return res.send({
                code: "You do not have permission to access this resource.",
            });
        }
    } catch (err) {
        return res.send({
            code: "Incorret app acronym",
        });
    }

    try {
        var rNumber = await new Promise((resolve, reject) => {
            let sql = "SELECT App_rnumber FROM application WHERE App_Acronym = ?";
            connection.query(sql, [taskAppAcronym], (err, result) => {
                if (err) reject(err);
                resolve(result[0].App_rnumber);
            });
        });
    } catch (err) {
        console.log("failed to retrieve r number ", err);
    }

    //validate for task notes
    if (!taskNote || taskNote != "") {
        if (taskNote.includes("**") || taskNote.includes("||")) {
            return res.status(200).json({
                code: "Task note cannot contain ** or ||",
            });
        }
    }

    const taskId = taskAppAcronym + "_" + rNumber;

    // generate task state
    const taskState = TASK_STATES.open;
    // generate task creator
    const taskCreator = username;
    // generate task owner
    const taskOwner = username;

    const taskCreateDate = dayjs().format(DATETIME_FORMAT);

    // system generated task note
    let taskNoteString = createNoteString("System", "open", `${taskOwner} has created the task.`);

    // user generated note string
    if (taskNote) {
        taskNoteString += createNoteString(taskOwner, "open", taskNote);
    }

    try {
        var createdTask = await new Promise((resolve, reject) => {
            const sql = `INSERT INTO task
            (Task_id, Task_name, Task_description, Task_plan, Task_app_acronym, Task_state, Task_creator, Task_owner, Task_createDate, Task_notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
            console.log("i am ran");
            connection.query(sql, [taskId, taskName, taskDescription, taskPlan, taskAppAcronym, taskState, taskCreator, taskOwner, taskCreateDate, taskNoteString], async (err, results) => {
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
                    taskCreateDate,
                    taskNoteString,
                });
            });
        });
    } catch (err) {
        return res.status(200).json({
            code: "Created task failed to complete",
        });
    }

    var incrementedRNumber = rNumber + 1;
    try {
        await new Promise((resolve, reject) => {
            const sql = "UPDATE application SET App_rnumber= ? WHERE App_Acronym = ?";
            connection.query(sql, [incrementedRNumber, taskAppAcronym], (err, results) => {
                if (err) reject(err);
                resolve(results);
            });
        });

        res.send({
            taskId: taskId,
            code: "success",
        });
    } catch (e) {
        console.log(e);
        // res.send({ success: false, message: e });
    }
};
