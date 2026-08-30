import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
}

const CURRENT_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL] ?? LOG_LEVELS.info

const LOG_DIR = path.join(__dirname, '../../logs')
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true })
}

const LOG_FILE = path.join(LOG_DIR, 'app.log')
const ERROR_LOG_FILE = path.join(LOG_DIR, 'error.log')

function formatMessage(level, message, meta = {}) {
  const timestamp = new Date().toISOString()
  const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : ''
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}\n`
}

function writeLog(level, message, meta = {}) {
  if (LOG_LEVELS[level] > CURRENT_LEVEL) return

  const formatted = formatMessage(level, message, meta)

  try {
    fs.appendFileSync(LOG_FILE, formatted)

    if (level === 'error') {
      fs.appendFileSync(ERROR_LOG_FILE, formatted)
    }
  } catch (error) {
    console.error('Failed to write log:', error.message)
  }

  if (process.env.NODE_ENV !== 'production') {
    const colors = {
      error: '\x1b[31m',
      warn: '\x1b[33m',
      info: '\x1b[36m',
      debug: '\x1b[90m',
      reset: '\x1b[0m',
    }
    console.log(`${colors[level] || ''}${formatted.trim()}${colors.reset}`)
  }
}

const logger = {
  error: (message, meta) => writeLog('error', message, meta),
  warn: (message, meta) => writeLog('warn', message, meta),
  info: (message, meta) => writeLog('info', message, meta),
  debug: (message, meta) => writeLog('debug', message, meta),
}

function requestLogger(req, res, next) {
  const start = Date.now()
  const ip = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown'

  res.on('finish', () => {
    const duration = Date.now() - start
    const logData = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip,
      userAgent: req.headers['user-agent'],
      userId: req.user?._id?.toString() || 'anonymous',
    }

    if (res.statusCode >= 500) {
      logger.error('Request completed with server error', logData)
    } else if (res.statusCode >= 400) {
      logger.warn('Request completed with client error', logData)
    } else {
      logger.info('Request completed', logData)
    }
  })

  next()
}

export default {
  logger,
  requestLogger,
}