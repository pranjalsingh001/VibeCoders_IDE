const router = require("express").Router();
const { protect } = require("../middlewares/authMiddleware");
const ctrl = require("../controllers/execController");

router.post("/start", protect, ctrl.start);
router.post("/stop", protect, ctrl.stop);

module.exports = router;
