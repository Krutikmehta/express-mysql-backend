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

// CREATE TABLE contact(
//     id INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
//     phoneNumber VARCHAR(255),
//     email VARCHAR(255),
//     linkedId INT,
//     linkPrecedence ENUM('primary','secondary') NOT NULL,
//     createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
//     updatedAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
//     deletedAt datetime)
