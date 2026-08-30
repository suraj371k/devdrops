import Joi from 'joi'
import userModel from '../models/userModel.js'
import authModule from '../middleware/auth.js'
import errorHandlerModule from '../middleware/errorHandler.js'
import loggerModule from '../middleware/logger.js'

const { generateToken } = authModule
const { AppError } = errorHandlerModule
const { logger } = loggerModule

const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(128).required(),
})

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  rememberMe: Joi.boolean(),
})

const preferencesSchema = Joi.object({
  theme: Joi.string().valid('light', 'dark'),
  defaultVisibility: Joi.string().valid('public', 'private'),
  recallInterval: Joi.number().integer().min(1).max(168),
}).min(1)

function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false })
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message),
      })
    }
    req.validatedBody = value
    next()
  }
}

const authController = {
  register: (req, res) => {
    const { username, email, password } = req.validatedBody
    const ip = req.ip || req.connection.remoteAddress

    userModel.create({ username, email, password })
      .then(user => {
        const token = generateToken(user)
        logger.info('User registered', { userId: user._id.toString(), ip })
        res.status(201).json({
          message: 'Registration successful',
          token,
          user: {
            _id: user._id,
            username: user.username,
            email: user.email,
            preferences: user.preferences,
            createdAt: user.createdAt,
          },
        })
      })
      .catch(err => {
        if (err.message.includes('already exists')) {
          return res.status(409).json({ error: err.message })
        }
        if (err.message.includes('Invalid') || err.message.includes('must be')) {
          return res.status(400).json({ error: err.message })
        }
        logger.error('Registration error', { error: err.message, ip })
        res.status(500).json({ error: 'Registration failed' })
      })
  },

  login: (req, res) => {
    const { email, password, rememberMe } = req.validatedBody
    const ip = req.ip || req.connection.remoteAddress

    userModel.findByEmailOrUsername(email)
      .then(user => {
        if (!user) {
          throw new AppError('Invalid credentials', 401)
        }
        return userModel.verifyPassword(user, password)
          .then(isValid => {
            if (!isValid) {
              throw new AppError('Invalid credentials', 401)
            }
            return user
          })
      })
      .then(user => {
        return userModel.updateLastLogin(user._id, ip)
          .then(() => user)
      })
      .then(user => {
        const token = generateToken(user)
        logger.info('User logged in', { userId: user._id.toString(), ip, rememberMe })
        res.json({
          message: 'Login successful',
          token,
          user: {
            _id: user._id,
            username: user.username,
            email: user.email,
            preferences: user.preferences,
            lastLogin: user.lastLogin,
            createdAt: user.createdAt,
          },
        })
      })
      .catch(err => {
        if (err.statusCode === 401) {
          return res.status(401).json({ error: err.message })
        }
        logger.error('Login error', { error: err.message, ip, email })
        res.status(500).json({ error: 'Login failed' })
      })
  },

  logout: (req, res) => {
    logger.info('User logged out', { userId: req.user._id.toString() })
    res.json({ message: 'Logged out successfully' })
  },

  me: (req, res) => {
    const user = req.user
    res.json({
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        preferences: user.preferences,
        lastLogin: user.lastLogin,
        lastLoginIP: user.lastLoginIP,
        createdAt: user.createdAt,
      },
    })
  },

  updatePreferences: (req, res) => {
    const userId = req.user._id
    const preferences = req.validatedBody

    userModel.updatePreferences(userId, preferences)
      .then(result => {
        if (!result) {
          throw new AppError('User not found', 404)
        }
        logger.info('Preferences updated', { userId: userId.toString() })
        res.json({
          message: 'Preferences updated',
          preferences: result.preferences,
        })
      })
      .catch(err => {
        if (err.message.includes('Invalid')) {
          return res.status(400).json({ error: err.message })
        }
        logger.error('Update preferences error', { error: err.message, userId: userId.toString() })
        res.status(500).json({ error: 'Failed to update preferences' })
      })
  },
}

export default {
  authController,
  validate,
  registerSchema,
  loginSchema,
  preferencesSchema,
}