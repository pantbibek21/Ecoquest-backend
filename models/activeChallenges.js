const mongoose = require("mongoose");

const userChallengeSchema = new mongoose.Schema(
    {
        challengeId: { type: Number, required: true },
        startedAt: { type: Date, default: Date.now },
        status: {
            type: String,
            enum: ["Registered", "Ongoing", "Completed"],
            default: "Registered",
        },
        dailyCompletedTasks: { type: [Number], default: [] },
        uniqueCompletedTasks: { type: [Number], default: [] },
        lastDailyResetDate: { type: String, default: null },
        points: { type: Number, default: 0 },
    },
    { _id: false } // kein extra _id pro subdoc
);

const activeChallengesSchema = new mongoose.Schema(
    {
        userId: { type: Number, required: true, unique: true, index: true },
        challenges: { type: [userChallengeSchema], default: [] },
    },
    { timestamps: true, collection: "activeChallenges" }
);

module.exports = mongoose.model("ActiveChallenges", activeChallengesSchema);
