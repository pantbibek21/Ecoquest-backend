const express = require("express");
const router = express.Router();

const User = require("../models/users"); 

// get all users
router.get("/profile", async (req, res) => {
  try {
    const users = await User.find({}).sort({ Id: 1 });
    return res.json(users); 
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Could not fetch users" });
  }
});


// get one user by id 
router.get("/profile/:id", async (req, res) => {
  try {
    const Id = Number(req.params.id);

    if (!Number.isFinite(Id)) {
      return res.status(400).json({ message: "Id must be a number!" });
    }

    const user = await User.findOne({ Id });
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json(user); 
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Could not fetch user" });
  }
});

// delete one user by id 
router.delete("/profile/:id", async (req, res) => {
  try {
    const Id = Number(req.params.id);

    if (!Number.isFinite(Id)) {
      return res.status(400).json({ message: "Id must be a number!" });
    }

    const result = await User.deleteOne({ Id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ message: `User ${Id} deleted` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Could not delete user" });
  }
});

// create user
// Body must include: firstName, lastName, userName, email, password
router.post("/signup/:id", async (req, res) => {
  try {
    const Id = Number(req.params.id);

    if (!Number.isFinite(Id)) {
      return res.status(400).json({ message: "Id must be a number!" });
    }

    const { firstName, lastName, userName, email, password } = req.body;

    if (!firstName || !lastName || !userName || !email || password === undefined) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!Number.isFinite(Number(password))) {
      return res.status(400).json({ message: "Password must be number!" });
    }

    const existingId = await User.findOne({ Id });
    if (existingId) {
      return res.status(409).json({ message: "User with this Id already exists" });
    }

    const existingUser = await User.findOne({
      $or: [{ userName }, { email }],
    });

    if (existingUser) {
      return res
        .status(409)
        .json({ message: "userName or email already in use" });
    }

    const newUser = await User.create({
      Id,
      firstName,
      lastName,
      userName,
      email,
      password: Number(password)
    });

    return res.status(201).json({
      message: `User ${Id} created`,
      user: newUser
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Could not create user" });
  }
});

// login user with Id + credentials
// Body: email and password
router.post("/login/:id", async (req, res) => {
  try {
    const Id = Number(req.params.id);

    if (!Number.isFinite(Id)) {
      return res.status(400).json({ message: "Id must be a number!" });
    }

    const { email, password } = req.body;

    if (!email || !password === undefined) {
      return res
        .status(400)
        .json({ message: "Provide email and password" });
    }

    if (!Number.isFinite(Number(password))) {
      return res.status(400).json({ message: "Password must be number!" });
    }

    const query = {
      Id,
      password: Number(password),
      email,
    };

    const user = await User.findOne(query);

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    return res.json({
      message: "Login successful",
      user
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Could not process login" });
  }
});

// delete user only if credentials match
// Body:  email and password
router.delete("/profile/:id/verify", async (req, res) => {
  try {
    const Id = Number(req.params.id);

    if (!Number.isFinite(Id)) {
      return res.status(400).json({ message: "Id must be a number!" });
    }

    const {email, password } = req.body;

    if ( !email || !password === undefined) {
      return res
        .status(400)
        .json({ message: "Provide email and password" });
    }

    if (!Number.isFinite(Number(password))) {
      return res.status(400).json({ message: "Password must be number!" });
    }

    const query = {
      Id,
      password: Number(password),
      email,
    };

    const user = await User.findOne(query);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const result = await User.deleteOne({ Id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ message: `User ${Id} deleted` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Could not delete user" });
  }
});

module.exports = router;