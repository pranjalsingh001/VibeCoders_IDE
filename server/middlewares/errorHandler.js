// This middleware handles errors that occur in any route/controller
const errorHandler = (err, req, res, next) => {
  console.error("🔥 Error:", err.message);

  // Default to 500 (Internal Server Error) if statusCode not set
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Something went wrong!",
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

module.exports = errorHandler;
