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

module.exports = { TASK_STATES, TASK_RANKS };
