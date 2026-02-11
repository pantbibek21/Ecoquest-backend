const express = require("express");
const router = express.Router();

const User = require("../models/users");

// get all users
router.get("/profile", async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: 1 });
    return res.json(users);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Could not fetch users" });
  }
});


// get one user by id 
router.get("/profile/:id", async (req, res) => {
  try {
    const _id = req.params.id;


    const user = await User.findOne({ _id });
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
    const _id = req.params.id;

    // if (!Number.isFinite(Id)) {
    //   return res.status(400).json({ message: "Id must be a number!" });
    // }

    const result = await User.deleteOne({ _id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ message: `User ${_id} deleted` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Could not delete user" });
  }
});

// create user
// Body must include: firstName, lastName, userName, email, password
router.post("/signup", async (req, res) => {
  try {
    const { firstName, lastName, userName, email, password } = req.body;

    if (!firstName || !lastName || !userName || !email || !password === undefined) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!Number.isFinite(Number(password))) {
      return res.status(400).json({ message: "Password must be number!" });
    }

    const existingUser = await User.findOne({
      $or: [{ userName }, { email }],
    });

    if (existingUser) {
      return res.status(409).json({
        message: "userName or email already in use"
      });
    }

    const newUser = await User.create({
      firstName,
      lastName,
      userName,
      email,
      password: Number(password)
    });

    return res.status(201).json({
      message: "User created",
      user: newUser
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
});


// login user with Id + credentials
// Body: email and password
router.post("/login/:id", async (req, res) => {
  try {
    const _id = req.params.id;

    // if (!Number.isFinite(Id)) {
    //   return res.status(400).json({ message: "Id must be a number!" });
    // }

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
      _id,
      email,
      password: Number(password),
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
    const _id = req.params.id;

    // if (!Number.isFinite(Id)) {
    //   return res.status(400).json({ message: "Id must be a number!" });
    // }

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
      _id,
      password: Number(password),
      email,
    };

    const user = await User.findOne(query);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const result = await User.deleteOne({ _id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ message: `User ${_id} deleted` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Could not delete user" });
  }
});

module.exports = router;