const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true }
});

// Index for sorting by name
projectSchema.index({ name: 1 });

module.exports = mongoose.model("Project", projectSchema);

