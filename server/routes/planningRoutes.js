const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const { getClarification, submitClarificationAnswers, getPlanningDocs } = require("../controllers/planningController");

router.post("/clarify", protect, getClarification);
router.post("/clarify/answer", protect, submitClarificationAnswers);
router.get("/docs", protect, getPlanningDocs);

module.exports = router;
