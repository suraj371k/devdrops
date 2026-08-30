import { ObjectId } from 'mongodb'
import database from '../db/connection.js'
import crypto from 'crypto'

const COLLECTION = 'collections'

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F8B500', '#00CED1',
]

const collectionModel = {
  async create(collectionData, userId) {
    const db = database.getDb()
    const collection = db.collection(COLLECTION)

    const { name, description, color, isShared } = collectionData

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new Error('Collection name is required')
    }
    if (name.length > 50) {
      throw new Error('Collection name must be 50 characters or less')
    }
    if (description && description.length > 200) {
      throw new Error('Description must be 200 characters or less')
    }

    const existingCollection = await collection.findOne({
      createdBy: new ObjectId(userId),
      name: name.trim(),
    })

    if (existingCollection) {
      throw new Error('Collection with this name already exists')
    }

    const now = new Date()
    const newCollection = {
      name: name.trim(),
      description: description?.trim() || '',
      createdBy: new ObjectId(userId),
      drops: [],
      color: color || this.generateRandomColor(),
      isShared: Boolean(isShared),
      createdAt: now,
      updatedAt: now,
    }

    if (isShared) {
      newCollection.shareToken = this.createShareTokenValue()
    }

    const result = await collection.insertOne(newCollection)
    return { ...newCollection, _id: result.insertedId }
  },

  async findById(id) {
    const db = database.getDb()
    const collection = db.collection(COLLECTION)
    return collection.findOne({ _id: new ObjectId(id) })
  },

  async findByShareToken(token) {
    const db = database.getDb()
    const collection = db.collection(COLLECTION)
    return collection.findOne({ shareToken: token, isShared: true })
  },

  async findAll(userId) {
    const db = database.getDb()
    const collection = db.collection(COLLECTION)

    const pipeline = [
      { $match: { createdBy: new ObjectId(userId) } },
      {
        $lookup: {
          from: 'drops',
          localField: 'drops',
          foreignField: '_id',
          as: 'dropDetails',
        },
      },
      {
        $addFields: {
          dropCount: { $size: '$drops' },
        },
      },
      {
        $project: {
          dropDetails: 0,
        },
      },
      { $sort: { createdAt: -1 } },
    ]

    return collection.aggregate(pipeline).toArray()
  },

  async findWithDrops(id, userId) {
    const db = database.getDb()
    const collection = db.collection(COLLECTION)

    const pipeline = [
      { $match: { _id: new ObjectId(id), createdBy: new ObjectId(userId) } },
      {
        $lookup: {
          from: 'drops',
          localField: 'drops',
          foreignField: '_id',
          as: 'drops',
        },
      },
      {
        $addFields: {
          dropCount: { $size: '$drops' },
        },
      },
    ]

    const result = await collection.aggregate(pipeline).toArray()
    return result[0] || null
  },

  async update(id, userId, updateData) {
    const db = database.getDb()
    const collection = db.collection(COLLECTION)

    const allowedFields = ['name', 'description', 'color', 'isShared']
    const updates = {}

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        if (field === 'name') {
          if (!updateData.name || updateData.name.trim().length === 0) {
            throw new Error('Collection name cannot be empty')
          }
          if (updateData.name.length > 50) {
            throw new Error('Collection name must be 50 characters or less')
          }

          const existing = await collection.findOne({
            createdBy: new ObjectId(userId),
            name: updateData.name.trim(),
            _id: { $ne: new ObjectId(id) },
          })
          if (existing) {
            throw new Error('Collection with this name already exists')
          }
          updates.name = updateData.name.trim()
        } else if (field === 'description') {
          if (updateData.description && updateData.description.length > 200) {
            throw new Error('Description must be 200 characters or less')
          }
          updates.description = updateData.description?.trim() || ''
        } else if (field === 'color') {
          if (updateData.color && !/^#[0-9A-Fa-f]{6}$/.test(updateData.color)) {
            throw new Error('Invalid color format. Use hex color code (e.g., #FF5733)')
          }
          updates.color = updateData.color || this.generateRandomColor()
        } else if (field === 'isShared') {
          const willBeShared = Boolean(updateData.isShared)
          updates.isShared = willBeShared

          if (willBeShared) {
            updates.shareToken = this.createShareTokenValue()
          } else {
            updates.$unset = { shareToken: '' }
          }
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      throw new Error('No valid fields to update')
    }

    const updateOps = { $set: {} }
    if (updates.$unset) {
      updateOps.$unset = updates.$unset
    }

    for (const [key, value] of Object.entries(updates)) {
      if (key !== '$unset') {
        updateOps.$set[key] = value
      }
    }
    updateOps.$set.updatedAt = new Date()

    return collection.findOneAndUpdate(
      { _id: new ObjectId(id), createdBy: new ObjectId(userId) },
      updateOps,
      { returnDocument: 'after' }
    )
  },

  async delete(id, userId) {
    const db = database.getDb()
    const collection = db.collection(COLLECTION)

    const result = await collection.deleteOne({ _id: new ObjectId(id), createdBy: new ObjectId(userId) })
    return result.deletedCount > 0
  },

  async addDrop(collectionId, userId, dropId) {
    const db = database.getDb()
    const collection = db.collection(COLLECTION)
    const dropsCollection = db.collection('drops')

    const coll = await collection.findOne({ _id: new ObjectId(collectionId), createdBy: new ObjectId(userId) })
    if (!coll) {
      throw new Error('Collection not found')
    }

    const drop = await dropsCollection.findOne({ _id: new ObjectId(dropId), createdBy: new ObjectId(userId) })
    if (!drop) {
      throw new Error('Drop not found or access denied')
    }

    if (coll.drops.some(d => d.equals(new ObjectId(dropId)))) {
      throw new Error('Drop already in collection')
    }

    await collection.updateOne(
      { _id: new ObjectId(collectionId) },
      { $addToSet: { drops: new ObjectId(dropId) }, $set: { updatedAt: new Date() } }
    )

    return true
  },

  async removeDrop(collectionId, userId, dropId) {
    const db = database.getDb()
    const collection = db.collection(COLLECTION)

    const coll = await collection.findOne({ _id: new ObjectId(collectionId), createdBy: new ObjectId(userId) })
    if (!coll) {
      throw new Error('Collection not found')
    }

    await collection.updateOne(
      { _id: new ObjectId(collectionId) },
      { $pull: { drops: new ObjectId(dropId) }, $set: { updatedAt: new Date() } }
    )

    return true
  },

  async generateShareToken(collectionId, userId) {
    const db = database.getDb()
    const collection = db.collection(COLLECTION)

    const coll = await collection.findOne({ _id: new ObjectId(collectionId), createdBy: new ObjectId(userId) })
    if (!coll) {
      throw new Error('Collection not found')
    }

    const shareToken = coll.shareToken && coll.isShared ? coll.shareToken : this.createShareTokenValue()

    await collection.updateOne(
      { _id: new ObjectId(collectionId), createdBy: new ObjectId(userId) },
      { $set: { isShared: true, shareToken, updatedAt: new Date() } }
    )

    return shareToken
  },

  async revokeShareToken(collectionId, userId) {
    const db = database.getDb()
    const collection = db.collection(COLLECTION)

    const result = await collection.updateOne(
      { _id: new ObjectId(collectionId), createdBy: new ObjectId(userId) },
      { $set: { isShared: false, updatedAt: new Date() }, $unset: { shareToken: '' } }
    )

    if (result.matchedCount === 0) {
      throw new Error('Collection not found')
    }

    return true
  },

  createShareTokenValue() {
    return crypto.randomBytes(16).toString('hex')
  },

  generateRandomColor() {
    return COLORS[Math.floor(Math.random() * COLORS.length)]
  },
}

export default collectionModel
