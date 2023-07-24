const jwt = require("jsonwebtoken");
const { sendToken } = require("../utils/jwtToken");
const bcrypt = require("bcryptjs");
const mysql = require("mysql");
const { USER_GROUPS } = require("../utils/userGroups");
const { isValidPassword } = require("../utils/auth");
const { getCompleteUser } = require("../controllers/userController");
const { config } = require("../utils/dbConfig");

connection = mysql.createConnection(config);

async function getTaskByTaskState(req, res, next) {
    console.log(req.body);
    // //check json body
    // try{
    //     console.log(JSON.parse(req.body));
    //     // JSON.parse(req.body);
    // }catch(e){
    //     console.log(e)
    //     return res.status(200).send({
    //         code:"invalid JSON body"
    //     })
    // }

    //Get values from json body
    if (!req.body.username || !req.body.password || !req.body.state) {
        return res.status(200).send({
            code: "mandatory values not filled",
        });
    }

    //check for params
    if (Object.keys(req.query).length > 0) {
        return res.status(200).send({
            code: "query params not allowed",
        });
    }

    //check if user is in db
    try {
        const user = await getCompleteUser(req.body.username);
        //Check if user is found
        if (!user) {
            return res.status(200).send({
                code: "Invalid username or password",
            });
        }
        //check if user is suspended
        if (user[0].isActive == 0) {
            return res.status(200).send({
                code: "user suspended",
            });
        }
        //check password
        const isValidCredentials = await bcrypt.compare(req.body.password, user[0].password);
        if (!isValidCredentials) {
            return res.status(200).send({
                code: "Invalid username or password",
            });
        }

        //check valid state
        const stateArray = ["open", "todo", "doing", "done", "closed"];
        if (!stateArray.includes(String(req.body.state).toLowerCase())) {
            return res.status(200).send({
                code: "Invalid state",
            });
        }
    } catch (e) {
        return res.status(200).send({
            code: "Invalid username or password",
        });
    }

    //query db
    if (req.body.appAcronym) {
        const sql = `SELECT Task_id, Task_name, Task_description, Task_notes, Task_plan, Task_app_acronym, Task_state, Task_creator, Task_owner, Task_createDate, Plan_colour FROM task 
        LEFT JOIN plan ON task.Task_plan = plan.Plan_mvp_name 
        WHERE task.Task_app_acronym = ? AND task.Task_state=?`;
        try {
            const result = await new Promise((resolve, reject) => {
                connection.query(sql, [String(req.body.appAcronym).toLowerCase(), String(req.body.state).toLowerCase()], (err, result) => {
                    if (err) reject(err);
                    else {
                        resolve(result);
                    }
                });
            });

            if (result.length <= 0) {
                return res.status(200).send({
                    code: "No tasks found",
                });
            }
            return res.status(200).send({
                code: "Task found",
                tasks: result,
            });
        } catch (e) {
            return res.status(200).send({
                code: "server error",
            });
        }
    } else {
        const sql = `SELECT Task_id, Task_name, Task_description, Task_notes, Task_plan, Task_app_acronym, Task_state, Task_creator, Task_owner, Task_createDate, Plan_colour FROM task 
        LEFT JOIN plan ON task.Task_plan = plan.Plan_mvp_name 
        WHERE task.Task_state=?`;

        try {
            const result = await new Promise((resolve, reject) => {
                connection.query(sql, [req.body.state], (err, result) => {
                    if (err) reject(err);
                    else {
                        resolve(result);
                    }
                });
            });

            if (result.length <= 0) {
                return res.status(200).send({
                    code: "No tasks found",
                });
            }
            return res.status(200).send({
                code: "Task found",
                tasks: result,
            });
        } catch (e) {
            return res.status(200).send({
                code: "server error",
            });
        }
    }
}

module.exports = {
    getTaskByTaskState,
};
