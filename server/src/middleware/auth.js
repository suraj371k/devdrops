import jwt from 'jsonwebtoken'
import database from '../db/connection.js'
import { ObjectId } from 'mongodb'

const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

function generateToken(user) {
  return jwt.sign(
    { userId: user._id.toString(), email: user.email, username: user.username },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' })
  }

  const token = authHeader.split(' ')[1]
  const decoded = verifyToken(token)

  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }

  try {
    const db = database.getDb()
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(decoded.userId) },
      { projection: { password: 0 } }
    )

    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }

    req.user = user
    req.token = token
    next()
  } catch (error) {
    return res.status(500).json({ error: 'Authentication error' })
  }
}

function optionalAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next()
  }

  const token = authHeader.split(' ')[1]
  const decoded = verifyToken(token)

  if (!decoded) {
    return next()
  }

  database.connect().then(() => {
    const db = database.getDb()
    return db.collection('users').findOne(
      { _id: new ObjectId(decoded.userId) },
      { projection: { password: 0 } }
    )
  }).then(user => {
    if (user) {
      req.user = user
      req.token = token
    }
    next()
  }).catch(() => next())
}

export default {
  authMiddleware,
  optionalAuthMiddleware,
  generateToken,
  verifyToken,
  JWT_SECRET,
}
