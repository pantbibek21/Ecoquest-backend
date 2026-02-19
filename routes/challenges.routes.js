const express = require("express");
const router = express.Router();
const Challenge = require("../models/challenges");
const ActiveChallenges = require("../models/activeChallenges");
const { isChallengeCompleted, resetDailyIfNewDay } = require("../utils/challenges");


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

        let changed = false;

        for (const p of userActive.challenges) {
            // 1) Daily reset (für alle Challenges)
            if (resetDailyIfNewDay(p)) changed = true;

            // 2) Completed-Check (braucht challenge.days aus DB)
            const challenge = await Challenge.findOne({ id: p.challengeId });
            if (!challenge) continue;

            const shouldBeCompleted = isChallengeCompleted(p, challenge);
            if (shouldBeCompleted && p.status !== "Completed") {
                p.status = "Completed";
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

router.post("/progress", async (req, res) => {
    try {
        const userId = Number(req.body.userId);
        const challengeId = Number(req.body.challengeId);
        const taskId = Number(req.body.taskId);
        const taskType = req.body.taskType; // "daily" | "unique"

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

        // Challenge laden
        const challenge = await Challenge.findOne({ id: challengeId });
        if (!challenge) return res.status(404).json({ message: "Challenge not found" });

        // Task-Liste prüfen
        const list = taskType === "daily" ? challenge.dailyToDo : challenge.uniqueToDo;
        const exists = Array.isArray(list) && list.some((t) => t.id === taskId);
        if (!exists) return res.status(404).json({ message: "Task not found in this taskType" });

        // UserActive laden/erstellen
        let userActive = await ActiveChallenges.findOne({ userId });
        if (!userActive) userActive = await ActiveChallenges.create({ userId, challenges: [] });

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
                points: 0,
            });
            progress = userActive.challenges.find((p) => p.challengeId === challengeId);
        }

        // Daily reset (nur wenn daily)
        if (taskType === "daily") {
            resetDailyIfNewDay(progress);
        }

        // Task updaten
        const key = taskType === "daily" ? "dailyCompletedTasks" : "uniqueCompletedTasks";
        const hasTask = progress[key].includes(taskId);

        if (completed && !hasTask) progress[key].push(taskId);
        if (!completed && hasTask) progress[key] = progress[key].filter((id) => id !== taskId);
        const pointsForTask = taskType === "daily" ? 1 : 10;

        // Nur wenn sich wirklich was ändert:
        if (completed && !hasTask) {
            progress.points += pointsForTask;      // z.B. daily +1, unique +10
        }
        if (!completed && hasTask) {
            progress.points -= pointsForTask;      // wieder abziehen
        }
        // Status setzen (Completed nur nach Tagen)
        if (isChallengeCompleted(progress, challenge)) {
            progress.status = "Completed";
        } else {
            const anyUnique = progress.uniqueCompletedTasks.length > 0;
            const anyDaily = progress.dailyCompletedTasks.length > 0;
            progress.status = (!anyUnique && !anyDaily) ? "Registered" : "Ongoing";
        }

        userActive.markModified("challenges");
        await userActive.save();

        return res.json({ message: "Progress updated", progress });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Could not update progress" });
    }
});

module.exports = router;
