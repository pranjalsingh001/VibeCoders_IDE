const router = require("express").Router();
const { protect } = require("../middlewares/authMiddleware");
const ctrl = require("../controllers/fileController");

router.post("/write", protect, ctrl.write);
router.get("/read", protect, ctrl.read);
router.get("/list", protect, ctrl.list);

module.exports = router;
