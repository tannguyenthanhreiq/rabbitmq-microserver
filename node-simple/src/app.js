const express = require("express");
require("dotenv").config();
const app = express();
const apiRoutes = require("./routes/apiRoutes");

// set view engine to ejs
app.use(express.static("public"));

// parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// parse application/json
app.use(express.json());

app.use("/api", apiRoutes());

const host = process.env.HOST || "localhost";
const port = process.env.PORT || 8080;
const url = `http://${host}:${port}`;

app.listen(port, () => {
  console.log(`serverr is running ${url} and listening on port ${port}`);
  console.log("hello world");
});
