const TASK_STATES = {
  open: "open",
  todo: "todo",
  doing: "doing",
  done: "done",
  closed: "closed",
};

const TASK_RANKS = {
  open: { promoted: TASK_STATES.todo, demoted: null },
  todo: { promoted: TASK_STATES.doing, demoted: TASK_STATES.open },
  doing: { promoted: TASK_STATES.done, demoted: TASK_STATES.todo },
  done: { promoted: TASK_STATES.closed, demoted: TASK_STATES.doing },
  closed: { promoted: null, demoted: TASK_STATES.done },
};

const ACTION_PERMISSION_COLUMNS = {
  create: "App_permit_create",
  open: "App_permit_open",
  todo: "App_permit_todolist",
  doing: "App_permit_doing",
  done: "App_permit_done",
  closed: "App_permit_closed",
};

module.exports = { TASK_STATES, TASK_RANKS, ACTION_PERMISSION_COLUMNS };
