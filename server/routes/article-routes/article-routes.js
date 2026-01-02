const express = require("express");
const {
  createArticle,
  getArticles,
  toggleWithMe,
  updateArticle,
  reportArticle
} = require("../../controllers/article-controller/article-controller");

const router = express.Router();

router.post("/create", createArticle);
router.get("/get", getArticles);
router.put("/update/:id", updateArticle);
router.post("/with-me/:id", toggleWithMe);
router.post("/report/:id", reportArticle);

module.exports = router;