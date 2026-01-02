const Article = require("../../models/Article");

const createArticle = async (req, res) => {
  try {
    const newArticle = new Article(req.body);
    await newArticle.save();
    res.status(201).json({ success: true, data: newArticle });
  } catch (e) {
    console.log(e);
    res.status(500).json({ success: false, message: "Error creating article" });
  }
};

const getArticles = async (req, res) => {
  try {
    const { search, category, userId } = req.query;
    let query = {};

    // 1. Search Logic
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ];
    }

    // 2. Filter Logic
    if (category === "My Articles") {
      // If "My Articles", show ONLY author's posts
      query.authorId = userId; 
    } else {
      // For public feed:
      // Exclude hidden articles (reports > 10)
      query.reportCount = { $lte: 10 }; 
      
      // Apply Category Filters
      if (category && category !== "Latest" && category !== "Most With Me") {
        query.category = { $in: category.split(",") };
      }
    }

    let articlesQuery = Article.find(query);

    // 3. Sorting Logic
    if (category === "Most With Me") {
      articlesQuery = articlesQuery.sort({ withMeUsers: -1 });
    } else {
      // Default: Latest first
      articlesQuery = articlesQuery.sort({ date: -1 }); 
    }

    const results = await articlesQuery;
    res.status(200).json({ success: true, data: results });
  } catch (e) {
    console.log(e);
    res.status(500).json({ success: false, message: "Error fetching articles" });
  }
};

const toggleWithMe = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const article = await Article.findById(id);
    if (!article) {
      return res.status(404).json({ success: false, message: "Article not found" });
    }

    const index = article.withMeUsers.indexOf(userId);
    if (index === -1) {
      // Add user
      article.withMeUsers.push(userId);
    } else {
      // Remove user
      article.withMeUsers.splice(index, 1);
    }

    await article.save();
    res.status(200).json({ success: true, data: article });
  } catch (e) {
    console.log(e);
    res.status(500).json({ success: false, message: "Error toggling With Me" });
  }
};

const updateArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedArticle = await Article.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json({ success: true, data: updatedArticle });
  } catch (e) {
    res.status(500).json({ success: false, message: "Error updating article" });
  }
};

const reportArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, reason } = req.body;

    const article = await Article.findById(id);
    if (!article) return res.status(404).json({ success: false, message: "Article not found" });

    // Check if user already reported
    const alreadyReported = article.reports.some(r => r.userId === userId);
    if (alreadyReported) {
      return res.status(400).json({ success: false, message: "You have already reported this article." });
    }

    // Add Report
    article.reports.push({ userId, reason });
    article.reportCount = article.reports.length;

    // Check threshold to hide
    if (article.reportCount > 10) {
      article.isHidden = true;
    }

    await article.save();
    res.status(200).json({ success: true, message: "Report submitted", data: article });
  } catch (e) {
    console.log(e);
    res.status(500).json({ success: false, message: "Error reporting article" });
  }
};

module.exports = {
  createArticle,
  getArticles,
  toggleWithMe,
  updateArticle,
  reportArticle,
};