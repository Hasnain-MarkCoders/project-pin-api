const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  createProject,
  togglePinProject,
  listProjects
} = require("../controllers/projectController");

router.post("/", auth, createProject);
router.post("/toggle-pin", auth, togglePinProject);
router.get("/", auth, listProjects);

module.exports = router;

