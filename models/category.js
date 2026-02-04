const mongoose = require("mongoose");


// Haupt-Schema (DAS wird zum Model)
const categorySchema = new mongoose.Schema(
    {
        id: { type: Number, required: true, unique: true },
        name: { type: String, required: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Category", categorySchema, "category");
