const mongoose = require("mongoose");

const ArticleSchema = new mongoose.Schema({
  title: String,
  content: String,
  category: String,
  authorId: String,
  authorName: String,
  date: {
    type: Date,
    default: Date.now, // Timestamp is already here
  },
  withMeUsers: [String], 
  
  // --- NEW: Reporting Logic ---
  reports: [
    {
      userId: String,
      reason: String, // e.g., "Spam", "False Info", "Harassment"
      timestamp: { type: Date, default: Date.now }
    }
  ],
  reportCount: {
    type: Number,
    default: 0
  },
  isHidden: {
    type: Boolean,
    default: false // Will become true if reportCount > 10
  }
});

module.exports = mongoose.model("Article", ArticleSchema);