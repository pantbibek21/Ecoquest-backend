const mongoose = require("mongoose");

// Sub-Schema (KEIN Model!)
const toDoSchema = new mongoose.Schema(
    {
        id: { type: Number, required: true },
        text: { type: String, required: true },
    },
    { _id: false }
);

// Haupt-Schema (DAS wird zum Model)
const challengeSchema = new mongoose.Schema(
    {
        id: { type: Number, required: true, unique: true },
        categoryId: { type: Number, required: true },

        title: { type: String, required: true },
        tagline: { type: String, required: true },
        description: { type: String, required: true },

        days: { type: Number, required: true },
        participants: { type: Number, default: 0 },

        cardImage: { type: String, required: true },

        // Hier: Array von Subdocuments
        toDo: { type: [toDoSchema], default: [] },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Challenge", challengeSchema);