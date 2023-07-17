const nodemailer = require("nodemailer");

let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const generateMailOptions = (recipientEmails, taskId) => {
  return {
    from: process.env.EMAIL_USERNAME,
    to: recipientEmails.join(", "),
    subject: "A new task is ready for your evaluation",
    html: `A new task ${taskId} is ready for your evaluation.`,
  };
};

module.exports = { transporter, generateMailOptions };
