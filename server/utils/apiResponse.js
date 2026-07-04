/**
 * Standard success response format
 */
const successResponse = (res, data, message = "Success") => {
  res.json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

/**
 * Standard error response format
 */
const errorResponse = (res, message, code = 500, details = null) => {
  res.status(code).json({
    success: false,
    error: {
      code,
      message,
      details,
      timestamp: new Date().toISOString()
    }
  });
};

/**
 * Validation error response
 */
const validationError = (res, errors) => errorResponse(res, "Validation failed", 400, errors);

module.exports = {
  successResponse,
  errorResponse,
  validationError
};