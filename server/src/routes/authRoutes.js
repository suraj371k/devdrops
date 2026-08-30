import express from 'express'
import authControllerModule from '../controllers/authController.js'
import authModule from '../middleware/auth.js'
import rateLimiterModule from '../middleware/rateLimiter.js'

const { authController, validate, registerSchema, loginSchema, preferencesSchema } = authControllerModule
const { authRateLimiter } = rateLimiterModule
const { authMiddleware } = authModule

const router = express.Router()

router.post('/register', authRateLimiter, validate(registerSchema), authController.register)
router.post('/login', authRateLimiter, validate(loginSchema), authController.login)
router.post('/logout', authMiddleware, authController.logout)
router.get('/me', authMiddleware, authController.me)
router.put('/preferences', authMiddleware, validate(preferencesSchema), authController.updatePreferences)

export default router