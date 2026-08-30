import loggerModule from './logger.js'
const { logger } = loggerModule

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500
  const message = err.message || 'Internal Server Error'

  const errorResponse = {
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  }

  if (err.name === 'ValidationError' || err.name === 'JoiValidationError') {
    errorResponse.details = err.details || err.errors
  }

  if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired' })
  }

  if (err.name === 'BSONError' || err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid ID format' })
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0]
    return res.status(409).json({ error: `${field} already exists` })
  }

  logger.error(`${req.method} ${req.path} - ${statusCode} - ${message}`, {
    userId: req.user?._id?.toString(),
    ip: req.ip,
    stack: err.stack,
  })

  res.status(statusCode).json(errorResponse)
}

function notFoundHandler(req, res) {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` })
}

class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message)
    this.statusCode = statusCode
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

export default {
  errorHandler,
  notFoundHandler,
  AppError,
}