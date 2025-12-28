const User = require("../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { 
      expiresIn: "7d" 
    });
    
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email 
      } 
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Optional: Register endpoint
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ message: "All fields required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { 
      expiresIn: "7d" 
    });

    res.status(201).json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email 
      } 
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

