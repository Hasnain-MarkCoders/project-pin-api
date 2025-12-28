const mongoose = require("mongoose");

const pinnedSchema = new mongoose.Schema({
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  project_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Project", 
    required: true 
  },
  pinned_at: { type: Date, default: Date.now }
});

// CRITICAL COMPOUND INDEX for performance
// Supports: finding user's pins, checking if specific project is pinned, sorting by pinned_at
pinnedSchema.index({ user_id: 1, project_id: 1, pinned_at: -1 });

// Unique constraint: user can only pin a project once
pinnedSchema.index({ user_id: 1, project_id: 1 }, { unique: true });

module.exports = mongoose.model("UserPinnedProjects", pinnedSchema);

