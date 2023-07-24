const express = require("express");
const app = express();
const dotenv = require("dotenv");
const mysql = require("mysql");
const cors = require("cors");
// const session = require("express-session");

dotenv.config({ path: "./config/config.env" });
app.use(express.json({ limit: "25mb" }));
app.use(cors());

// app.use(function (req, res, next) {
//   res.header("Access-Control-Allow-Origin", "http://localhost:3000*");
//   res.header(
//     "Access-Control-Allow-Headers",
//     "Origin, X-Requested-With, Content-Type, Accept"
//   );
//   next();
// });
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        res.status(400).json({ error: "E013" });
    } else {
        next();
    }
});
const authRoutes = require("./routes/routes");
app.use(authRoutes);
app.use((req, res, next) => {
    res.status(200).send({
        code: "E007",
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
