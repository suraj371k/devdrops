import database from '../db/connection.js'
import { ObjectId } from 'mongodb'

async function checkDropOwnership(req, res, next) {
  const dropId = req.params.id || req.params.dropId
  const userId = req.user._id

  try {
    const db = database.getDb()
    const drop = await db.collection('drops').findOne(
      { _id: new ObjectId(dropId) },
      { projection: { createdBy: 1 } }
    )

    if (!drop) {
      return res.status(404).json({ error: 'Drop not found' })
    }

    if (!drop.createdBy.equals(userId)) {
      return res.status(403).json({ error: 'Not authorized to access this drop' })
    }

    req.drop = drop
    next()
  } catch (error) {
    if (error.name === 'BSONError') {
      return res.status(400).json({ error: 'Invalid drop ID' })
    }
    return res.status(500).json({ error: 'Server error' })
  }
}

async function checkCollectionOwnership(req, res, next) {
  const collectionId = req.params.id || req.params.collectionId
  const userId = req.user._id

  try {
    const db = database.getDb()
    const collection = await db.collection('collections').findOne(
      { _id: new ObjectId(collectionId) },
      { projection: { createdBy: 1 } }
    )

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' })
    }

    if (!collection.createdBy.equals(userId)) {
      return res.status(403).json({ error: 'Not authorized to access this collection' })
    }

    req.collection = collection
    next()
  } catch (error) {
    if (error.name === 'BSONError') {
      return res.status(400).json({ error: 'Invalid collection ID' })
    }
    return res.status(500).json({ error: 'Server error' })
  }
}

async function checkDropAccess(req, res, next) {
  const dropId = req.params.id || req.params.dropId
  const userId = req.user?._id

  try {
    const db = database.getDb()
    const drop = await db.collection('drops').findOne(
      { _id: new ObjectId(dropId) },
      { projection: { createdBy: 1, visibility: 1 } }
    )

    if (!drop) {
      return res.status(404).json({ error: 'Drop not found' })
    }

    const isOwner = drop.createdBy.equals(userId)
    const isPublic = drop.visibility === 'public'

    if (!isOwner && !isPublic) {
      return res.status(403).json({ error: 'Not authorized to access this drop' })
    }

    req.drop = drop
    req.isOwner = isOwner
    next()
  } catch (error) {
    if (error.name === 'BSONError') {
      return res.status(400).json({ error: 'Invalid drop ID' })
    }
    return res.status(500).json({ error: 'Server error' })
  }
}

async function checkCollectionAccess(req, res, next) {
  const collectionId = req.params.id || req.params.collectionId
  const userId = req.user?._id

  try {
    const db = database.getDb()
    const collection = await db.collection('collections').findOne(
      { _id: new ObjectId(collectionId) },
      { projection: { createdBy: 1, isShared: 1 } }
    )

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' })
    }

    const isOwner = collection.createdBy.equals(userId)
    const isShared = collection.isShared

    if (!isOwner && !isShared) {
      return res.status(403).json({ error: 'Not authorized to access this collection' })
    }

    req.collection = collection
    req.isOwner = isOwner
    next()
  } catch (error) {
    if (error.name === 'BSONError') {
      return res.status(400).json({ error: 'Invalid collection ID' })
    }
    return res.status(500).json({ error: 'Server error' })
  }
}

export default {
  checkDropOwnership,
  checkCollectionOwnership,
  checkDropAccess,
  checkCollectionAccess,
}