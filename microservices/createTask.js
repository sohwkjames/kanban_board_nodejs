module.exports.createTask = async function create(req, res, next) {
    const { taskName, taskDescription, taskPlan, appAcronym, taskNote } = req.body;

    const username = req.header.username;
    const password = req.header.password;

    if (!username || !password) {
        res.status(200).json({
            cocde: "username or password is empty", //TODO change to code
        });
    }

    const isValidPermissions = await checkUserCanPerformAction(appAcronym, username, "App_permit_create");

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
        let taskNoteString = createNoteString("System", "open", `${taskOwner} has created the task.`);

        // user generated note string
        if (taskNote) {
            taskNoteString += createNoteString(taskOwner, "open", taskNote);
        }

        const createdTask = await new Promise((resolve, reject) => {
            const sql = `INSERT INTO task
        (Task_id, Task_name, Task_description, Task_plan, Task_app_acronym, Task_state, Task_creator, Task_owner, Task_createDate, Task_notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
            connection.query(sql, [taskId, taskName, taskDescription, taskPlan, appAcronym, taskState, taskCreator, taskOwner, taskCreateDate, taskNoteString], (err, results) => {
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
            });
        });

        const incrementedRNumber = rNumber + 1;

        await new Promise((resolve, reject) => {
            const sql = "UPDATE application SET App_rnumber= ? WHERE App_Acronym = ?";
            connection.query(sql, [incrementedRNumber, appAcronym], (err, results) => {
                if (err) reject(err);
                resolve(results);
            });
        });

        res.send({
            success: true,
        });
    } catch (e) {
        res.send({ success: false, message: e });
    }
};
