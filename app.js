const cors = require("cors");
const express = require("express");
const app = express();
require("dotenv").config();

app.use(cors({ origin: "http://localhost:5173" }));

app.use(express.json());
const mongoose = require("mongoose");

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.log("Failed to connect to MongoDB", err);
  });


const challengesRoutes = require("./routes/challenges.routes.js");
const categoriesRoutes = require("./routes/categories.routes.js");
const usersRoute = require("./routes/users.routes.js");

app.use("/challenges", challengesRoutes);
app.use("/categories", categoriesRoutes);
app.use("/users", usersRoute);

app.get("/", (req, res) => {
  res.send("Server is working");
});

app.listen(3000, () => {
  console.log("Listening on port 3000");
});
