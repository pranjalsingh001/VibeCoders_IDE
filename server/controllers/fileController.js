const { writeFile, readFile, listDir } = require("../services/fileService");

// POST /api/v1/files/write
exports.write = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { projectId, relativePath, content } = req.body;
    if (!projectId || !relativePath) return res.status(400).json({ success: false, message: "projectId and relativePath required" });

    await writeFile({ userId, projectId, relativePath, content });
    return res.status(200).json({ success: true, message: "File written" });
  } catch (e) {
    console.error("File write error:", e);
    return res.status(500).json({ success: false, message: "Failed to write file" });
  }
};

// GET /api/v1/files/read?projectId=...&relativePath=...
exports.read = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { projectId, relativePath } = req.query;
    const result = await readFile({ userId, projectId, relativePath });
    return res.status(200).json({ success: true, ...result });
  } catch (e) {
    console.error("File read error:", e);
    return res.status(500).json({ success: false, message: "Failed to read file" });
  }
};

// GET /api/v1/files/list?projectId=...&dir=src
exports.list = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { projectId, dir } = req.query;
    const entries = await listDir({ userId, projectId, relativeDir: dir || "" });
    return res.status(200).json({ success: true, entries });
  } catch (e) {
    console.error("File list error:", e);
    return res.status(500).json({ success: false, message: "Failed to list directory" });
  }
};
