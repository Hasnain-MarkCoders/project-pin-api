const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { 
  createNotification, 
  getNotifications, 
  markAsRead 
} = require("../controllers/notificationController");

router.post("/", auth, createNotification);
router.get("/", auth, getNotifications);
router.patch("/:notificationId/read", auth, markAsRead);

module.exports = router;

