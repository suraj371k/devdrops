const rateLimitStore = new Map()

function cleanupStore() {
  const now = Date.now()
  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

setInterval(cleanupStore, 60000)

function createRateLimiter(options = {}) {
  const {
    windowMs = 60000,
    maxRequests = 100,
    keyGenerator = (req) => req.ip,
    skip = () => false,
    message = 'Too many requests, please try again later',
    statusCode = 429,
    headers = true,
  } = options

  return (req, res, next) => {
    if (skip(req)) {
      return next()
    }

    const key = keyGenerator(req)
    const now = Date.now()

    let data = rateLimitStore.get(key)

    if (!data || now > data.resetTime) {
      data = {
        count: 0,
        resetTime: now + windowMs,
      }
      rateLimitStore.set(key, data)
    }

    data.count++

    const remaining = Math.max(0, maxRequests - data.count)
    const resetTime = Math.ceil(data.resetTime / 1000)

    if (headers) {
      res.setHeader('X-RateLimit-Limit', maxRequests)
      res.setHeader('X-RateLimit-Remaining', remaining)
      res.setHeader('X-RateLimit-Reset', resetTime)
    }

    if (data.count > maxRequests) {
      const retryAfter = Math.ceil((data.resetTime - now) / 1000)
      res.setHeader('Retry-After', retryAfter)

      return res.status(statusCode).json({
        error: message,
        retryAfter,
      })
    }

    next()
  }
}

const authRateLimiter = createRateLimiter({
  windowMs: 60000,
  maxRequests: 5,
  keyGenerator: (req) => `auth:${req.ip}`,
  message: 'Too many authentication attempts, please try again later',
})

const publicRateLimiter = createRateLimiter({
  windowMs: 60000,
  maxRequests: 20,
  keyGenerator: (req) => `public:${req.ip}`,
  message: 'Too many requests to public endpoints',
})

const recallRateLimiter = createRateLimiter({
  windowMs: 60000,
  maxRequests: 30,
  keyGenerator: (req) => `recall:${req.user?._id || req.ip}`,
  message: 'Too many recall requests',
})

const generalRateLimiter = createRateLimiter({
  windowMs: 60000,
  maxRequests: 100,
  keyGenerator: (req) => `general:${req.ip}`,
  message: 'Too many requests',
})

export default {
  createRateLimiter,
  authRateLimiter,
  publicRateLimiter,
  recallRateLimiter,
  generalRateLimiter,
}