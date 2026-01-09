const express = require("express");
const router = express.Router();

const {
    challenges,
    userChallenges,
} = require("../data/mockData");

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

// Enroll
router.post("/:id/enroll", (req, res) => {
    const challengeId = Number(req.params.id);
    const { userId } = req.body;

    const challenge = challenges.find((c) => c.id === challengeId);
    if (!challenge) {
        return res.status(404).json({ message: "Challenge not found" });
    }

    const alreadyParticipating = userChallenges.some(
        (uc) => uc.userId === userId && uc.challengeId === challengeId
    );

    if (!alreadyParticipating) {
        userChallenges.push({ userId, challengeId, active: true });
    }

    res.json({
        message: `User ${userId} enrolled`,
    });
});

module.exports = router;