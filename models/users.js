const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        userId: { type: Number}, 
        firstName: { type: String, required: true, trim: true },
        lastName: { type: String, required: true, trim: true },
        userName: { type: String, required: true, trim: true, unique: true, index: true  }, 
        email: { 
            type: String,
            required: true, 
            lowercase: true,
            unique: true, 
            trim: true, 
            index: true,
            validate: {
                validator: (v) =>
                 /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
                 message: 'Invalid email format'
                }
         }, 
        password: { type: String, required: true }, 
    },
    { timestamps: true } // createdAt / updatedAt
);

module.exports = mongoose.model("User", userSchema);
