const router = require("express").Router();
const { protect } = require("../middlewares/authMiddleware");
const { write, read, list } = require("../controllers/fileController");

router.post("/write", protect, write);
router.get("/read", protect, read);
router.get("/list", protect, list);

module.exports = router;
