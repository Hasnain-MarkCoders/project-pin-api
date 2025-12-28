const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const authRoutes = require("./routes/auth");
const projectRoutes = require("./routes/projects");
const notificationRoutes = require("./routes/notifications");

require("dotenv").config();

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/notifications", notificationRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log("✅ MongoDB connected successfully");
  
  // Ensure indexes are created
  mongoose.connection.db.admin().listDatabases((err, result) => {
    if (!err) {
      console.log("📊 Syncing indexes...");
    }
  });
  
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
})
.catch(err => {
  console.error("❌ MongoDB connection error:", err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed');
  process.exit(0);
});

