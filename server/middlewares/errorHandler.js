// middlewares/errorHandler.js
module.exports = (err, req, res, next) => {
  console.error('🔥 [ERROR HANDLER] Error stack:', err.stack);
  console.error('🔥 [ERROR HANDLER] Request body:', req.body);
  console.error('🔥 [ERROR HANDLER] Request params:', req.params);
  console.error('🔥 [ERROR HANDLER] Request query:', req.query);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};
