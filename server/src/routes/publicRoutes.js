import express from 'express'
import publicControllerModule from '../controllers/publicController.js'
import rateLimiterModule from '../middleware/rateLimiter.js'
import authModule from '../middleware/auth.js'

const { publicController } = publicControllerModule
const { publicRateLimiter } = rateLimiterModule
const { optionalAuthMiddleware } = authModule

const router = express.Router()

router.use(publicRateLimiter)

router.get('/share/:token', publicController.getSharedCollection)
router.get('/explore', optionalAuthMiddleware, publicController.explorePublicDrops)

export default router
