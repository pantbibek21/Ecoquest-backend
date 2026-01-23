const express = require("express");
const router = express.Router();

const { challenges } = require("../data/mockData");
const activeChallenges = require("../data/activeChallenges");




// Alle Challenges
router.get("/", (req, res) => {
    res.json(challenges);
});





// Einzelne Challenge
router.get("/:id", (req, res) => {
    const id = Number(req.params.id);
    const challenge = challenges.find((c) => c.id === id);

    if (!challenge) {
        return res.status(404).json({ message: "Challenge not found" });
    }

    res.json(challenge);
});





// POST /challenges/register
router.post("/register", (req, res) => {
    const userId = Number(req.body.userId);
    const challengeId = Number(req.body.challengeId);

    // Validation
    if (!Number.isFinite(userId) || !Number.isFinite(challengeId)) {
        return res.status(400).json({ message: "userId und challengeId müssen Nummern sein!" });
    }

    // CHallenge gibt es?
    const challenge = challenges.find((c) => c.id === challengeId);
    if (!challenge) {
        return res.status(404).json({ message: "Challenge not found" });
    }

    // User suchen oder anlegen
    let userActive = activeChallenges.find((u) => u.userId === userId);
    if (!userActive) {
        userActive = { userId, challenges: [] };
        activeChallenges.push(userActive);
    }

    // Sicherstellen, dass challenges ein Array ist
    if (!Array.isArray(userActive.challenges)) userActive.challenges = [];

    // Progress-Eintrag für diese Challenge suchen
    let progressEntry = userActive.challenges.find((c) => c.challengeId === challengeId);

    // Wenn nicht vorhanden -> anlegen, sonst ggf. Status updaten
    if (!progressEntry) {
        progressEntry = {
            challengeId,
            status: "Registered",
            completedTasks: [],
        };
        userActive.challenges.push(progressEntry);
    } else {
        // optional: wenn schon da, Status setzen / reparieren
        progressEntry.status = "Registered";
        if (!Array.isArray(progressEntry.completedTasks)) progressEntry.completedTasks = [];
    }

    return res.status(201).json({
        message: `User ${userId} registered for challenge ${challengeId}`,
        user: userActive,
    });
});



// POST /challenges/unregister
router.post("/unregister", (req, res) => {
    const userId = Number(req.body.userId);
    const challengeId = Number(req.body.challengeId);

    // Validation
    if (!Number.isFinite(userId) || !Number.isFinite(challengeId)) {
        return res.status(400).json({ message: "userId und challengeId müssen Nummern sein!" });
    }

    // User finden
    const userIndex = activeChallenges.findIndex((u) => u.userId === userId);
    if (userIndex === -1) {
        return res.status(404).json({ message: "User not found in activeChallenges" });
    }

    const userActive = activeChallenges[userIndex];
    if (!Array.isArray(userActive.challenges)) userActive.challenges = [];

    // Challenge beim User finden
    const challengeIndex = userActive.challenges.findIndex(
        (c) => c.challengeId === challengeId
    );

    if (challengeIndex === -1) {
        return res.status(404).json({ message: "Challenge not registered for this user" });
    }

    // Entfernen
    userActive.challenges.splice(challengeIndex, 1);

    // Optional: Wenn keine Challenges mehr, User komplett löschen
    if (userActive.challenges.length === 0) {
        activeChallenges.splice(userIndex, 1);
    }

    return res.status(200).json({
        message: `User ${userId} unregistered from challenge ${challengeId}`,
        user: userActive, // wenn user gelöscht wurde, ist das Objekt zwar noch in der Variable, aber nicht mehr im Array
    });
});




// POST /challenges/progress
router.post("/progress", (req, res) => {
  const userId = Number(req.body.userId);
  const challengeId = Number(req.body.challengeId);
  const taskId = Number(req.body.taskId);
  const completed = Boolean(req.body.completed);

  if (!Number.isFinite(userId) || !Number.isFinite(challengeId) || !Number.isFinite(taskId)) {
    return res.status(400).json({ message: "userId, challengeId, taskId müssen Nummern sein!" });
  }

  // Challenge & Task existieren?
  const challenge = challenges.find((c) => c.id === challengeId);
  if (!challenge) return res.status(404).json({ message: "Challenge not found" });

  const taskExists = challenge.toDo?.some((t) => t.id === taskId);
  if (!taskExists) return res.status(404).json({ message: "Task not found in this challenge" });

  // User finden
  let userActive = activeChallenges.find((u) => u.userId === userId);
  if (!userActive) {
    return res.status(404).json({ message: "User has no active challenges" });
  }
  if (!Array.isArray(userActive.challenges)) userActive.challenges = [];

  // Challenge beim User finden
  let progress = userActive.challenges.find((c) => c.challengeId === challengeId);
  if (!progress) {
    return res.status(404).json({ message: "User is not registered for this challenge" });
  }

  if (!Array.isArray(progress.completedTasks)) progress.completedTasks = [];

  // completedTasks updaten
  const hasTask = progress.completedTasks.includes(taskId);

  if (completed && !hasTask) progress.completedTasks.push(taskId);
  if (!completed && hasTask) {
    progress.completedTasks = progress.completedTasks.filter((id) => id !== taskId);
  }

  // Status automatisch setzen (optional, aber praktisch)
  const totalTasks = Array.isArray(challenge.toDo) ? challenge.toDo.length : 0;
  const done = progress.completedTasks.length;

  if (done === 0) progress.status = "Registered";
  else if (totalTasks > 0 && done >= totalTasks) progress.status = "Completed";
  else progress.status = "Ongoing";

  return res.json({
    message: "Progress updated",
    progress,
  });
});


// GET /challenges/progress/:userId
router.get("/progress/:userId", (req, res) => {
  const userId = Number(req.params.userId);
  if (!Number.isFinite(userId)) {
    return res.status(400).json({ message: "userId muss eine Nummer sein!" });
  }

  const userActive = activeChallenges.find((u) => u.userId === userId);
  if (!userActive) {
    return res.status(404).json({ message: "No progress found for this user" });
  }

  return res.json(userActive);
});



module.exports = router;