const express = require("express");
const app = express();
const path = require('path')  // nasr
require("dotenv").config();
app.use(express.json());
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
  }).catch((err) => {
    console.log("Failed to connect to MongoDB", err);
  });

app.set('views', path.join(__dirname, 'views'))  // nasr
app.set('view engine', 'ejs')  // nasr

const challengesRoutes = require("./routes/challenges.routes.js");
const categoriesRoutes = require("./routes/categories.routes.js");
const users = require("./routes/users.routes.js"); // nasr

app.use("/challenges", challengesRoutes);
app.use("/categories", categoriesRoutes);
app.use("/users", users) // nasr

app.get("/", (req, res) => {
  res.send("Server is working");
});

app.get('/login', (req, res) => {
  // go to login page // nasr
  res.render('login_page')
})


app.listen(3000, () => {
  console.log("Listening on port 3000");
});