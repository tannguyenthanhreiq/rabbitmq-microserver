const express = require("express");
const compression = require("compression");

const app = express();
const apiRoutes = require("./routes/apiRoutes");

app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use("/api", apiRoutes());

const PORT = process.env.PORT || 4444;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
