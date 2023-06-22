// const mysql = require("mysql2/promise");

// // This controller uses the mysql2 pool config, just for reference

// const config = {
//   host: "localhost",
//   user: "root",
//   password: process.env.LOCAL_DB_PASSWORD,
//   database: process.env.LOCAL_DB_DATABASE,
// };

// const pool = mysql.createPool(config);

// async function getUsers() {
//   const connection = await pool.getConnection();
//   console.log("getUsers fired");
//   const [rows, fields] = await connection.execute("SELECT * FROM accounts");
//   console.log("getUsers rows", rows);
// }

// module.exports = { getUsers };
