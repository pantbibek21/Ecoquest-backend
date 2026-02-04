const express = require("express");
const router = express.Router();
const Challenge = require("../models/challenges");
const ActiveChallenges = require("../models/activeChallenges");

// GET /challenges -> alle Challenges aus MongoDB
router.get("/", async (req, res) => {
    try {
        const challenges = await Challenge.find().sort({ id: 1 }); // optional sort
        res.json(challenges);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Could not fetch challenges" });
    }
});

// Einzelne Challenge
router.get("/:id", async (req, res) => {
    const id = Number(req.params.id);
    const challenge = await Challenge.findOne({ id: id });

    if (!challenge) {
        return res.status(404).json({ message: "Challenge not found" });
    }

    res.json(challenge);
});

// POST /challenges/register
router.post("/register", async (req, res) => {
    try {
        const userId = Number(req.body.userId);
        const challengeId = Number(req.body.challengeId);

        if (!Number.isFinite(userId) || !Number.isFinite(challengeId)) {
            return res.status(400).json({ message: "userId und challengeId müssen Nummern sein!" });
        }

        // Challenge existiert?
        const challenge = await Challenge.findOne({ id: challengeId });
        if (!challenge) {
            return res.status(404).json({ message: "Challenge not found" });
        }

        // User-Dokument holen oder anlegen
        const userActive = await ActiveChallenges.findOneAndUpdate(
            { userId },
            {
                $setOnInsert: { userId },
                // Challenge nur hinzufügen wenn sie noch nicht drin ist:
                $addToSet: {
                    challenges: {
                        challengeId,
                        status: "Registered",
                        completedTasks: [],
                    },
                },
            },
            { new: true, upsert: true }
        );

        // Wenn du willst: Status bei erneutem Register auf Registered setzen
        // (weil $addToSet keine Updates macht, nur "nicht doppelt hinzufügen")
        await ActiveChallenges.updateOne(
            { userId, "challenges.challengeId": challengeId },
            {
                $set: { "challenges.$.status": "Registered" },
                $setOnInsert: { userId },
            }
        );

        const updated = await ActiveChallenges.findOne({ userId });

        return res.status(201).json({
            message: `User ${userId} registered for challenge ${challengeId}`,
            user: updated,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Could not register challenge" });
    }
});




// POST /challenges/unregister
router.post("/unregister", async (req, res) => {
    try {
        const userId = Number(req.body.userId);
        const challengeId = Number(req.body.challengeId);

        if (!Number.isFinite(userId) || !Number.isFinite(challengeId)) {
            return res.status(400).json({ message: "userId und challengeId müssen Nummern sein!" });
        }

        const result = await ActiveChallenges.findOneAndUpdate(
            { userId },
            { $pull: { challenges: { challengeId } } },
            { new: true }
        );

        if (!result) {
            return res.status(404).json({ message: "User not found in activeChallenges" });
        }

        return res.json({
            message: `User ${userId} unregistered from challenge ${challengeId}`,
            user: result,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Could not unregister challenge" });
    }
});

// POST /challenges/progress
router.post("/progress", async (req, res) => {
    try {
        const userId = Number(req.body.userId);
        const challengeId = Number(req.body.challengeId);
        const taskId = Number(req.body.taskId);

        // WICHTIG: Boolean("false") wäre true -> daher strikt prüfen
        const completedRaw = req.body.completed;
        const completed =
            completedRaw === true ||
            completedRaw === "true" ||
            completedRaw === 1 ||
            completedRaw === "1";

        if (!Number.isFinite(userId) || !Number.isFinite(challengeId) || !Number.isFinite(taskId)) {
            return res.status(400).json({ message: "userId, challengeId, taskId müssen Nummern sein!" });
        }

        // Challenge existiert + Task existiert?
        const challenge = await Challenge.findOne({ id: challengeId });
        if (!challenge) return res.status(404).json({ message: "Challenge not found" });

        const taskExists = Array.isArray(challenge.toDo) && challenge.toDo.some((t) => t.id === taskId);
        if (!taskExists) return res.status(404).json({ message: "Task not found in this challenge" });

        // User progress doc finden
        const userActive = await ActiveChallenges.findOne({ userId });
        if (!userActive) {
            return res.status(404).json({ message: "User has no active challenges" });
        }

        const progress = userActive.challenges.find((c) => c.challengeId === challengeId);
        if (!progress) {
            return res.status(404).json({ message: "User is not registered for this challenge" });
        }

        // completedTasks updaten (im Doc)
        if (!Array.isArray(progress.completedTasks)) progress.completedTasks = [];
        const hasTask = progress.completedTasks.includes(taskId);

        if (completed && !hasTask) progress.completedTasks.push(taskId);
        if (!completed && hasTask) {
            progress.completedTasks = progress.completedTasks.filter((id) => id !== taskId);
        }

        // Status berechnen
        const totalTasks = Array.isArray(challenge.toDo) ? challenge.toDo.length : 0;
        const done = progress.completedTasks.length;

        if (done === 0) progress.status = "Registered";
        else if (totalTasks > 0 && done >= totalTasks) progress.status = "Completed";
        else progress.status = "Ongoing";

        await userActive.save();

        return res.json({
            message: "Progress updated",
            progress,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Could not update progress" });
    }
});

// GET /challenges/progress/:userId
router.get("/progress/:userId", async (req, res) => {
    try {
        const userId = Number(req.params.userId);
        if (!Number.isFinite(userId)) {
            return res.status(400).json({ message: "userId muss eine Nummer sein!" });
        }

        const userActive = await ActiveChallenges.findOne({ userId });
        if (!userActive) {
            return res.status(404).json({ message: "No progress found for this user" });
        }

        return res.json(userActive);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Could not fetch progress" });
    }
});

module.exports = router;