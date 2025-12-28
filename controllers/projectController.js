const Project = require("../models/project");
const UserPinnedProject = require("../models/userPinnedProject");
const mongoose = require("mongoose");

exports.createProject = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: "Project name required" });
    }

    const project = await Project.create({ name });
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.togglePinProject = async (req, res) => {
  try {
    const { projectId } = req.body;
    const userId = req.user._id;

    if (!projectId) {
      return res.status(400).json({ message: "Project ID required" });
    }

    // Check if project exists
    const projectExists = await Project.findById(projectId);
    if (!projectExists) {
      return res.status(404).json({ message: "Project not found" });
    }

    const existing = await UserPinnedProject.findOne({ 
      user_id: userId, 
      project_id: projectId 
    });

    if (existing) {
      await UserPinnedProject.deleteOne({ _id: existing._id });
      return res.json({ message: "Project unpinned", isPinned: false });
    } else {
      const pinned = await UserPinnedProject.create({ 
        user_id: userId, 
        project_id: projectId 
      });
      return res.json({ message: "Project pinned", isPinned: true, pinned });
    }
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.listProjects = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const projects = await Project.aggregate([
      // Lookup pinned info for current user
      {
        $lookup: {
          from: "userpinnedprojects", // Mongoose pluralizes collection names
          let: { projectId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$project_id", "$$projectId"] },
                    { $eq: ["$user_id", new mongoose.Types.ObjectId(userId)] }
                  ]
                }
              }
            }
          ],
          as: "pinInfo"
        }
      },
      // Lookup unread notifications count for current user
      {
        $lookup: {
          from: "notifications",
          let: { projectId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$project_id", "$$projectId"] },
                    { $eq: ["$recipient_id", new mongoose.Types.ObjectId(userId)] },
                    { $eq: ["$isRead", false] }
                  ]
                }
              }
            },
            { $count: "count" }
          ],
          as: "unreadNotifications"
        }
      },
      // Add computed fields
      {
        $addFields: {
          isPinned: { $gt: [{ $size: "$pinInfo" }, 0] },
          pinnedAt: { $arrayElemAt: ["$pinInfo.pinned_at", 0] },
          unreadCount: { 
            $ifNull: [
              { $arrayElemAt: ["$unreadNotifications.count", 0] }, 
              0
            ] 
          },
          hasUnread: { 
            $gt: [
              { $ifNull: [{ $arrayElemAt: ["$unreadNotifications.count", 0] }, 0] }, 
              0
            ] 
          }
        }
      },
      // Sort: pinned first, then by pinnedAt desc, then by name asc
      { 
        $sort: { 
          isPinned: -1, 
          pinnedAt: -1, 
          name: 1 
        } 
      },
      // // Pagination
      { $skip: skip },
      { $limit: parseInt(limit) },
      // // Remove temporary fields
      { $project: { pinInfo: 0, unreadNotifications: 0 } }
    ]);

    // Get total count
    const total = await Project.countDocuments();

    res.json({
      projects,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalProjects: total,
        hasMore: skip + projects.length < total
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.bulkClear = async (req, res) => {
  try {
    const { clearProjects, clearNotifications, clearPinnedProjects } = req.body;
    
    const results = {
      projects: { deleted: 0 },
      notifications: { deleted: 0 },
      pinnedProjects: { deleted: 0 }
    };

    // Clear projects if requested
    if (clearProjects === true) {
      const projectResult = await Project.deleteMany({});
      results.projects.deleted = projectResult.deletedCount;
    }

    // Clear notifications if requested
    if (clearNotifications === true) {
      const Notification = require("../models/notification");
      const notificationResult = await Notification.deleteMany({});
      results.notifications.deleted = notificationResult.deletedCount;
    }

    // Clear pinned projects if requested
    if (clearPinnedProjects === true) {
      const pinnedResult = await UserPinnedProject.deleteMany({});
      results.pinnedProjects.deleted = pinnedResult.deletedCount;
    }

    // If no flags were set, return error
    if (!clearProjects && !clearNotifications && !clearPinnedProjects) {
      return res.status(400).json({ 
        message: "At least one clear option must be specified",
        options: {
          clearProjects: "Set to true to clear all projects",
          clearNotifications: "Set to true to clear all notifications",
          clearPinnedProjects: "Set to true to clear all pinned projects"
        }
      });
    }

    res.json({
      message: "Bulk clear completed",
      results
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
