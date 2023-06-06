const express = require("express");
require("dotenv").config();
const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const identityRouter = require("./routes/identity.router");

app.use("/api/v1/identity", identityRouter);
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("server running ..... ");
});
