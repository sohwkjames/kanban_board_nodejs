const express = require("express");
const app = express();
const dotenv = require("dotenv");
const mysql = require("mysql");
// const session = require("express-session");

dotenv.config({ path: "./config/config.env" });
app.use(express.json());
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

const authRoutes = require("./routes/auth");
app.use(authRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
