const router = require("express").Router();
const { protect } = require("../middlewares/authMiddleware");
const ctrl = require("../controllers/codeGenController");

// Step 1: Build a file plan from LLD
router.post("/plan", protect, ctrl.createPlan);

// Step 2: Apply plan → generate code files (supports dryRun + subset)
router.post("/apply", protect, ctrl.applyPlan);

// Step 2b: Apply plan in batches with retry and status tracking
router.post("/applyBatch", protect, ctrl.applyPlanBatch);

// Step 2c: Get codegen status for all files
router.get("/status", protect, ctrl.getCodegenStatus);

// Step 2d: Apply plan using queue system (recommended)
router.post("/applyQueue", protect, ctrl.applyPlanQueue);

// Step 3: Finalize code generation (linting, testing, build)
router.post("/finalize", protect, ctrl.finalizeCodegen);

module.exports = router;


