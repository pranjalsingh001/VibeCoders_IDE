const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const { getClarification,submitClarificationAnswers } = require("../controllers/planningController");


router.post("/clarify", protect, getClarification);
router.post("/clarify/answer", protect, submitClarificationAnswers);


module.exports = router;
