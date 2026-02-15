const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        firstName: { type: String },
        lastName: { type: String },
        userName: { type: String },
        email: { type: String },
        password: { type: String },
    },
    { timestamps: true } // createdAt / updatedAt
);

module.exports = mongoose.model("User", userSchema);
