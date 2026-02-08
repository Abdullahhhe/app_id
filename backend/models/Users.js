const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, default: "user" },
    lastLogin: Date,
    lastActivity: Date,
    totalTimeSpent: { type: Number, default: 0 } // بالثواني
});

module.exports = mongoose.model("User", userSchema);