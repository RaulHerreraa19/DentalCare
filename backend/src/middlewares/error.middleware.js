const AppError = require('../utils/AppError');
const ApiResponse = require('../utils/apiResponse');

const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';

  if (process.env.NODE_ENV === 'development') {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: err,
      stack: err.stack,
    });
  }

  // Production Error Handling
  if (err.isOperational) {
    return ApiResponse.error(res, err.message, err.statusCode);
  }

  // Programming or unknown errors
  console.error('ERROR 💥', err);
  return ApiResponse.error(res, 'Algo salió muy mal!', 500);
};

module.exports = globalErrorHandler;
