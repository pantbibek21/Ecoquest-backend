const express = require("express");
const router = express.Router();
const User = require("../models/users");


// session status 
router.get("/session", (req, res) => {
  if (req.session && req.session.user) {
    return res.json({ loggedIn: true, user: req.session.user });
  }
  return res.json({ loggedIn: false, user: null });
});



//  middleware: require the user to be logged in 
function requireLogin(req, res, next) {
  if (req.session && req.session.user && req.session.user.id) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
}



// **************************************************
//       -------- routes for users ----------- 
// **************************************************

// create user
// Body must include: firstName, lastName, userName, email, password
router.post("/signup", async (req, res) => {
  try {
    const { firstName, lastName, userName, email, password } = req.body;

    if (!firstName || !lastName || !userName || !email || !password === undefined) {
      return res.status(400).json({ message: "Missing required fields" });
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
      password,
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



// login (set the session)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || password === undefined) {
      return res.status(400).json({ message: "Provide email and password" });
    }


    const user = await User.findOne({
      email,
      password,
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Create the session payload
    req.session.user = {
      id: user._id.toString(),
      email: user.email,
      userName: user.userName,
    };

    return res.json({
      message: "Login successful",
      user: req.session.user
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Could not process login" });
  }
});


// logout (destroy the session and clear the cookie)
router.post("/logout", (req, res) => {
  if (!req.session) {
    return res.json({ message: "Logged out" });
  }

  req.session.destroy((err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Could not log out" });
    }
    res.clearCookie("sid", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });
    return res.json({ message: "Logged out" });
  });
});




// DELETE /users/me  -> delete the currently logged-in user's account
router.delete("/me", requireLogin, async (req, res) => {
  try {
    const userId = req.session.user.id;

    const result = await User.deleteOne({ _id: userId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Destroy session after deleting account
    req.session.destroy((err) => {
      if (err) {
        console.error(err);
        // User is deleted, but session failed to destroy; clear cookie anyway
      }

      res.clearCookie("sid", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      });
      return res.json({ message: "Account deleted and logged out" });
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Could not delete account" });
  }
});






// **************************************************
// -------- routes only for frontend team ----------- 
// **************************************************

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