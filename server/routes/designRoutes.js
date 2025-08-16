const router = require("express").Router();
const { protect } = require("../middlewares/authMiddleware");
const ctrl = require("../controllers/designController");

// Generate High-Level Design (HLD)
router.post("/hld", protect, ctrl.createHLD);

// Generate Low-Level Design (LLD) — requires HLD first
router.post("/lld", protect, ctrl.createLLD);

// Fetch design docs (HLD/LLD) for a project
router.get("/docs", protect, ctrl.getDesignDocs);

module.exports = router;
