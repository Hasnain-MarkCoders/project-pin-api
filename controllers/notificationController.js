const Notification = require("../models/notification");

exports.createNotification = async (req, res) => {
  try {
    const { recipient_id, title, body, project_id } = req.body;
    const sender_id = req.user._id;

    if (!recipient_id || !title) {
      return res.status(400).json({ 
        message: "Recipient ID and title are required" 
      });
    }

    const notification = await Notification.create({
      recipient_id,
      sender_id,
      project_id,
      title,
      body
    });

    res.status(201).json(notification);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const filter = { recipient_id: userId };
    if (unreadOnly === 'true') {
      filter.isRead = false;
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('sender_id', 'name email')
      .populate('project_id', 'name');

    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({ 
      recipient_id: userId, 
      isRead: false 
    });

    res.json({
      notifications,
      unreadCount,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        total
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient_id: userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

