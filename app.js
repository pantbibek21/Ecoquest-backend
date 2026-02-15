const cors = require("cors");
const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const app = express();
require("dotenv").config();


const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";


app.use(cors({ 
  origin: CLIENT_ORIGIN,
  credentials: true,
}));

app.use(express.json());


app.use(session({
  name: "sid",                            
  secret: process.env.SESSION_SECRET,     
  resave: false,                          
  saveUninitialized: false,               
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,       
    ttl: 60 * 60 * 24 ,                
    autoRemove: "interval",               
    autoRemoveInterval: 10,                
    touchAfter: 12 * 3600,                
  }),
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 ,       
    secure: process.env.NODE_ENV === "production",        
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  },
}));


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
