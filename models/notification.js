const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  recipient_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  sender_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  },
  project_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Project" 
  },
  isRead: { type: Boolean, default: false },
  title: { type: String, required: true },
  body: String,
  createdAt: { type: Date, default: Date.now }
});

// Compound index for querying user's notifications
// Supports: get all notifications, filter by read status, filter by project
notificationSchema.index({ recipient_id: 1, isRead: 1, createdAt: -1 });

// Optional: Index for project-specific notifications
notificationSchema.index({ project_id: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);

