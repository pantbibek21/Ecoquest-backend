const mongoose = require("mongoose");

const userChallengeSchema = new mongoose.Schema(
    {
        challengeId: { type: Number, required: true },
        status: {
            type: String,
            enum: ["Registered", "Ongoing", "Completed"],
            default: "Registered",
        },
        completedTasks: { type: [Number], default: [] },
    },
    { _id: false } // wichtig: kein extra _id pro subdoc
);

const activeChallengesSchema = new mongoose.Schema(
    {
        userId: { type: Number, required: true, unique: true, index: true },
        challenges: { type: [userChallengeSchema], default: [] },
    },
    { timestamps: true, collection: "activeChallenges" }
);

module.exports = mongoose.model("ActiveChallenges", activeChallengesSchema);
