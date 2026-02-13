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
                        completedDailyToDo: [],
                        completedUniqueToDo: []
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

router.post("/progress", async (req, res) => {
    try {
        const userId = Number(req.body.userId);
        const challengeId = Number(req.body.challengeId);
        const taskId = Number(req.body.taskId);

        // NEW: daily|unique
        const taskType = req.body.taskType;

        // Boolean sauber parsen
        const completedRaw = req.body.completed;
        const completed =
            completedRaw === true ||
            completedRaw === "true" ||
            completedRaw === 1 ||
            completedRaw === "1";

        // Validation
        if (!Number.isFinite(userId) || !Number.isFinite(challengeId) || !Number.isFinite(taskId)) {
            return res.status(400).json({ message: "userId, challengeId, taskId müssen Nummern sein!" });
        }
        if (taskType !== "daily" && taskType !== "unique") {
            return res.status(400).json({ message: "taskType muss 'daily' oder 'unique' sein!" });
        }

        // CHANGED: Challenge aus DB
        const challenge = await Challenge.findOne({ id: challengeId });
        if (!challenge) return res.status(404).json({ message: "Challenge not found" });

        // Task-Liste aus DB
        const list = taskType === "daily" ? challenge.dailyToDo : challenge.uniqueToDo;

        // Task existiert in der Liste?
        const exists = Array.isArray(list) && list.some((t) => t.id === taskId);
        if (!exists) return res.status(404).json({ message: "Task not found in this taskType" });

        // User Active doc laden/erstellen
        let userActive = await ActiveChallenges.findOne({ userId });
        if (!userActive) {
            userActive = await ActiveChallenges.create({ userId, challenges: [] });
        }

        // Progress finden/erstellen
        let progress = userActive.challenges.find((p) => p.challengeId === challengeId);
        if (!progress) {
            userActive.challenges.push({
                challengeId,
                startedAt: new Date(),
                status: "Registered",
                uniqueCompletedTasks: [],
                dailyCompletedTasks: [],
                lastDailyResetDate: null,
            });
            progress = userActive.challenges.find((p) => p.challengeId === challengeId);
        }

        // Heute (Berlin) für Daily Reset
        const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(new Date());

        // Daily reset, wenn neuer Tag
        if (taskType === "daily" && progress.lastDailyResetDate !== today) {
            progress.dailyCompletedTasks = [];
            progress.lastDailyResetDate = today;
        }

        // Array wählen
        const key = taskType === "daily" ? "dailyCompletedTasks" : "uniqueCompletedTasks";

        // Update Task
        const hasTask = progress[key].includes(taskId);
        if (completed && !hasTask) progress[key].push(taskId);
        if (!completed && hasTask) progress[key] = progress[key].filter((id) => id !== taskId);

        // Status: Completed nur nach Ablauf der days
        const daysTotal = Number(challenge.days) || 0;
        const startedAt = new Date(progress.startedAt);
        const endAt = new Date(startedAt.getTime() + daysTotal * 24 * 60 * 60 * 1000);

        if (daysTotal > 0 && new Date() >= endAt) {
            progress.status = "Completed";
        } else {
            const anyUnique = progress.uniqueCompletedTasks.length > 0;
            const anyDaily = progress.dailyCompletedTasks.length > 0;
            progress.status = (!anyUnique && !anyDaily) ? "Registered" : "Ongoing";
        }

        // Bei Subdoc-Änderungen: sicherheitshalber markieren
        userActive.markModified("challenges");

        await userActive.save();

        return res.json({ message: "Progress updated", progress });
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

        // HEUTE als YYYY-MM-DD (Berlin)
        const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(new Date());

        let changed = false;

        // Wenn neuer Tag: alle dailyCompletedTasks resetten
        for (const c of userActive.challenges) {
            if (c.lastDailyResetDate !== today) {
                c.dailyCompletedTasks = [];
                c.lastDailyResetDate = today;
                changed = true;
            }
        }

        if (changed) {
            userActive.markModified("challenges");
            await userActive.save();
        }

        return res.json(userActive);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Could not fetch progress" });
    }
});

module.exports = router;
