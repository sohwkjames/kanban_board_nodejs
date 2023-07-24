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

    //Get values from json body
    if (!req.body.username || !req.body.password || !req.body.state) {
        return res.status(200).send({
            code: "E003",
        });
    }

    //check for params
    if (Object.keys(req.query).length > 0) {
        return res.status(200).send({
            code: "E007",
        });
    }

    //Check for unexpected fields in the request body 
    if(req.body.appAcronym || req.body.appAcronym == "") var expectedFields = ['username', 'password', 'state', 'appAcronym'];
    else var expectedFields = ['username', 'password', 'state'];
    const unexpectedFields = Object.keys(req.body).filter((field) => !expectedFields.includes(field));
    if (unexpectedFields.length > 0) {
        return res.status(200).send({
            code: "E013",
        });
    }

    //check if user is in db
    try {
        const user = await getCompleteUser(req.body.username);
        //Check if user is found
        if (!user) {
            return res.status(200).send({
                code: "E004",
            });
        }
        //check if user is suspended
        if (user[0].isActive == 0) {
            return res.status(200).send({
                code: "E001",
            });
        }
        //check password
        const isValidCredentials = await bcrypt.compare(req.body.password, user[0].password);
        if (!isValidCredentials) {
            return res.status(200).send({
                code: "E004",
            });
        }

        //check valid state
        const stateArray = ["open", "todo", "doing", "done", "closed"];
        if (!stateArray.includes(String(req.body.state).toLowerCase())) {
            return res.status(200).send({
                code: "E008",
            });
        }
    } catch (e) {
        return res.status(200).send({
            code: "E004",
        });
    }

    //query db
    if (req.body.appAcronym) {
        const sql = `SELECT Task_id, Task_name, Task_description, Task_notes, Task_plan, Task_app_acronym, Task_state, Task_creator, Task_owner, Task_createDate, Plan_colour FROM task 
        LEFT JOIN plan ON task.Task_plan = plan.Plan_mvp_name 
        WHERE task.Task_app_acronym = ? AND task.Task_state=?`;
        const checkAppSql = `SELECT COUNT(App_Acronym) as count FROM application WHERE App_Acronym = ?;`
    
        try {
            //Check for app acronym
            const appResult = await new Promise((resolve, reject) => {
                connection.query(checkAppSql, [String(req.body.appAcronym).toLowerCase()], (err, result) => {
                    if (err) reject(err);
                    else {
                        resolve(result);
                    }
                });
            }); 

            if(appResult[0].count < 1){
                return res.status(200).send({
                    code: "E005",
                });
            }

            //Get task with app acronym
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
                    code: "S001",
                    tasks: []
                });
            }
            return res.status(200).send({
                code: "S001",
                tasks: result,
            });
        } catch (e) {
            return res.status(200).send({
                code: "E011",
            });
        }
    } else {
        const sql = `SELECT Task_id, Task_name, Task_description, Task_notes, Task_plan, Task_app_acronym, Task_state, Task_creator, Task_owner, Task_createDate, Plan_colour FROM task 
        LEFT JOIN plan ON task.Task_plan = plan.Plan_mvp_name 
        WHERE task.Task_state=?`;

        try {
            //Get task without app acronym
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
                    code: "S001",
                    tasks: []
                });
            }
            return res.status(200).send({
                code: "S001",
                tasks: result,
            });
        } catch (e) {
            return res.status(200).send({
                code: "E011",
            });
        }
    }
}

module.exports = {
    getTaskByTaskState,
};
