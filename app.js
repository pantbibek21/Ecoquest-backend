const express = require("express");
const app = express();

app.use(express.json());

const challengesRoutes = require("./routes/challenges.routes.js");
const categoriesRoutes = require("./routes/categories.routes.js");

app.use("/challenges", challengesRoutes);
app.use("/categories", categoriesRoutes);

app.get("/", (req, res) => {
  res.send("Server is working");
});

app.listen(3000, () => {
  console.log("Listening on port 3000");
});