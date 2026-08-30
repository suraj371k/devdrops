import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import database from './db/connection.js'
import loggerModule from './middleware/logger.js'
import errorHandlerModule from './middleware/errorHandler.js'
import rateLimiterModule from './middleware/rateLimiter.js'

const { requestLogger } = loggerModule
const { errorHandler, notFoundHandler } = errorHandlerModule
const { generalRateLimiter } = rateLimiterModule

import authRoutes from './routes/authRoutes.js'
import dropRoutes from './routes/dropRoutes.js'
import collectionRoutes from './routes/collectionRoutes.js'
import publicRoutes from './routes/publicRoutes.js'

const app = express()

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use(requestLogger)
app.use(generalRateLimiter)

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: database.isConnected ? 'connected' : 'disconnected',
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/drops', dropRoutes)
app.use('/api/collections', collectionRoutes)
app.use('/api/public', publicRoutes)

app.use(notFoundHandler)
app.use(errorHandler)

export default app