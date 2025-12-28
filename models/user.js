const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true }
});

// Index for email lookups (login)
userSchema.index({ email: 1 });

module.exports = mongoose.model("User", userSchema);

