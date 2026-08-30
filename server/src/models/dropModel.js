import { ObjectId } from 'mongodb'
import database from '../db/connection.js'
import recallService from '../services/recallService.js'
import tagService from '../services/tagService.js'
import searchService from '../services/searchService.js'

const COLLECTION = 'drops'
const VALID_TYPES = ['code', 'command', 'link', 'note']
const VALID_VISIBILITY = ['public', 'private']

const dropModel = {
  async create(dropData, userId) {
    const db = database.getDb()
    const collection = db.collection(COLLECTION)

    const { title, content, type, language, tags, visibility, isFavorite } = dropData

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      throw new Error('Title is required')
    }
    if (title.length > 100) {
      throw new Error('Title must be 100 characters or less')
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      throw new Error('Content is required')
    }

    const detectedType = type || recallService.detectType(content)
    if (!VALID_TYPES.includes(detectedType)) {
      throw new Error('Invalid drop type')
    }

    const extractedTags = tags || tagService.extractTags(content, detectedType)
    const finalTags = [...new Set(extractedTags)].slice(0, 5)

    const finalVisibility = visibility || 'private'
    if (!VALID_VISIBILITY.includes(finalVisibility)) {
      throw new Error('Invalid visibility')
    }

    const now = new Date()
    const nextRecallDate = recallService.calculateNextRecallDate(now, 0)

    const suggestedRelated = await searchService.findRelatedDrops(userId, content, finalTags, detectedType)

    const drop = {
      title: title.trim(),
      content: content.trim(),
      type: detectedType,
      language: language || null,
      tags: finalTags,
      visibility: finalVisibility,
      createdBy: new ObjectId(userId),
      isFavorite: Boolean(isFavorite),
      recallCount: 0,
      lastRecalled: null,
      nextRecallDate,
      relatedDrops: suggestedRelated.map(id => new ObjectId(id)),
      createdAt: now,
      updatedAt: now,
    }

    const result = await collection.insertOne(drop)

    if (suggestedRelated.length > 0) {
      await this.addRelatedDropsBatch(result.insertedId, suggestedRelated)
    }

    return { ...drop, _id: result.insertedId }
  },

  async findById(id) {
    const db = database.getDb()
    const collection = db.collection(COLLECTION)
    return collection.findOne({ _id: new ObjectId(id) })
  },

  async findByIdWithRelations(id, userId) {
    const db = database.getDb()
    const collection = db.collection(COLLECTION)

    const pipeline = [
      { $match: { _id: new ObjectId(id) } },
      {
        $lookup: {
          from: 'drops',
          localField: 'relatedDrops',
          foreignField: '_id',
          as: 'relatedDropsData',
        },
      },
      {
        $addFields: {
          relatedDropsData: {
            $map: {
              input: '$relatedDropsData',
              as: 'drop',
              in: {
                _id: '$$drop._id',
                title: '$$drop.title',
                type: '$$drop.type',
                language: '$$drop.language',
                tags: '$$drop.tags',
                recallCount: '$$drop.recallCount',
              },
            },
          },
        },
      },
    ]

    const result = await collection.aggregate(pipeline).toArray()
    return result[0] || null
  },

  async findAll(userId, filters = {}, page = 1, limit = 8) {
    const db = database.getDb()
    const collection = db.collection(COLLECTION)

    const query = { createdBy: new ObjectId(userId) }

    if (filters.type && VALID_TYPES.includes(filters.type)) {
      query.type = filters.type
    }
    if (filters.visibility && VALID_VISIBILITY.includes(filters.visibility)) {
      query.visibility = filters.visibility
    }
    if (filters.language) {
      query.language = filters.language
    }
    if (filters.tags && Array.isArray(filters.tags) && filters.tags.length > 0) {
      query.tags = { $in: filters.tags }
    }
    if (filters.isFavorite !== undefined) {
      query.isFavorite = filters.isFavorite === 'true'
    }
    if (filters.search) {
      query.$text = { $search: filters.search }
    }

    const sort = {}
    if (filters.sort === 'oldest') sort.createdAt = 1
    else if (filters.sort === 'most_recalled') sort.recallCount = -1
    else if (filters.sort === 'alphabetical') sort.title = 1
    else sort.createdAt = -1

    const skip = (page - 1) * limit

    const [drops, total] = await Promise.all([
      collection.find(query).sort(sort).skip(skip).limit(limit).toArray(),
      collection.countDocuments(query),
    ])

    return {
      drops,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  },

  async findDueForRecall(userId, page = 1, limit = 8) {
    const db = database.getDb()
    const collection = db.collection(COLLECTION)

    const now = new Date()
    const query = {
      createdBy: new ObjectId(userId),
      nextRecallDate: { $lte: now },
    }

    const skip = (page - 1) * limit

    const [drops, total] = await Promise.all([
      collection.find(query).sort({ nextRecallDate: 1 }).skip(skip).limit(limit).toArray(),
      collection.countDocuments(query),
    ])

    return {
      drops,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  },

  async findPublic(filters = {}, page = 1, limit = 8) {
    const db = database.getDb()
    const collection = db.collection(COLLECTION)

    const query = { visibility: 'public' }

    if (filters.type && VALID_TYPES.includes(filters.type)) {
      query.type = filters.type
    }
    if (filters.language) {
      query.language = filters.language
    }
    if (filters.tags && Array.isArray(filters.tags) && filters.tags.length > 0) {
      query.tags = { $in: filters.tags }
    }
    if (filters.search) {
      query.$text = { $search: filters.search }
    }

    const sort = {}
    if (filters.sort === 'oldest') sort.createdAt = 1
    else if (filters.sort === 'most_recalled') sort.recallCount = -1
    else if (filters.sort === 'alphabetical') sort.title = 1
    else sort.createdAt = -1

    const skip = (page - 1) * limit

    const [drops, total] = await Promise.all([
      collection.find(query).sort(sort).skip(skip).limit(limit).toArray(),
      collection.countDocuments(query),
    ])

    return {
      drops,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  },

  async update(id, userId, updateData) {
    const db = database.getDb()
    const collection = db.collection(COLLECTION)

    const allowedFields = ['title', 'content', 'type', 'language', 'tags', 'visibility', 'isFavorite']
    const updates = {}

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        if (field === 'title') {
          if (!updateData.title || updateData.title.trim().length === 0) {
            throw new Error('Title cannot be empty')
          }
          if (updateData.title.length > 100) {
            throw new Error('Title must be 100 characters or less')
          }
          updates.title = updateData.title.trim()
        } else if (field === 'content') {
          if (!updateData.content || updateData.content.trim().length === 0) {
            throw new Error('Content cannot be empty')
          }
          updates.content = updateData.content.trim()
        } else if (field === 'type') {
          if (!VALID_TYPES.includes(updateData.type)) {
            throw new Error('Invalid drop type')
          }
          updates.type = updateData.type
        } else if (field === 'language') {
          updates.language = updateData.language || null
        } else if (field === 'tags') {
          updates.tags = [...new Set(updateData.tags || [])].slice(0, 5)
        } else if (field === 'visibility') {
          if (!VALID_VISIBILITY.includes(updateData.visibility)) {
            throw new Error('Invalid visibility')
          }
          updates.visibility = updateData.visibility
        } else if (field === 'isFavorite') {
          updates.isFavorite = Boolean(updateData.isFavorite)
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      throw new Error('No valid fields to update')
    }

    updates.updatedAt = new Date()

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id), createdBy: new ObjectId(userId) },
      { $set: updates },
      { returnDocument: 'after' }
    )

    return result
  },

  async delete(id, userId) {
    const db = database.getDb()
    const session = db.client.startSession()

    try {
      await session.withTransaction(async () => {
        const collection = db.collection(COLLECTION)
        const recallHistoryCollection = db.collection('recallHistory')
        const collectionsCollection = db.collection('collections')

        const drop = await collection.findOne({ _id: new ObjectId(id), createdBy: new ObjectId(userId) }, { session })
        if (!drop) {
          throw new Error('Drop not found')
        }

        await recallHistoryCollection.deleteMany({ dropId: new ObjectId(id) }, { session })
        await collectionsCollection.updateMany(
          { drops: new ObjectId(id) },
          { $pull: { drops: new ObjectId(id) } },
          { session }
        )
        await collection.deleteOne({ _id: new ObjectId(id) }, { session })

        if (drop.relatedDrops && drop.relatedDrops.length > 0) {
          await collection.updateMany(
            { _id: { $in: drop.relatedDrops } },
            { $pull: { relatedDrops: new ObjectId(id) } },
            { session }
          )
        }
      })

      return true
    } finally {
      await session.endSession()
    }
  },

  async markRecalled(id, userId, recallType = 'manual', confidence = 3) {
    const db = database.getDb()
    const collection = db.collection(COLLECTION)
    const recallHistoryCollection = db.collection('recallHistory')

    const drop = await collection.findOne({ _id: new ObjectId(id), createdBy: new ObjectId(userId) })
    if (!drop) {
      throw new Error('Drop not found')
    }

    const now = new Date()
    const newRecallCount = drop.recallCount + 1
    const nextRecallDate = recallService.calculateNextRecallDate(now, newRecallCount)

    await collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          recallCount: newRecallCount,
          lastRecalled: now,
          nextRecallDate,
          updatedAt: now,
        },
      }
    )

    await recallHistoryCollection.insertOne({
      dropId: new ObjectId(id),
      userId: new ObjectId(userId),
      recalledAt: now,
      recallType,
      confidence: Math.max(1, Math.min(5, confidence)),
    })

    return { recallCount: newRecallCount, nextRecallDate }
  },

  async addRelatedDrop(id, userId, relatedDropId) {
    const db = database.getDb()
    const collection = db.collection(COLLECTION)

    if (id === relatedDropId) {
      throw new Error('Cannot relate drop to itself')
    }

    const drop = await collection.findOne({ _id: new ObjectId(id), createdBy: new ObjectId(userId) })
    if (!drop) {
      throw new Error('Drop not found')
    }

    const relatedDrop = await collection.findOne({ _id: new ObjectId(relatedDropId) })
    if (!relatedDrop) {
      throw new Error('Related drop not found')
    }

    if (drop.relatedDrops.some(rd => rd.equals(new ObjectId(relatedDropId)))) {
      throw new Error('Drops are already related')
    }

    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $addToSet: { relatedDrops: new ObjectId(relatedDropId) }, $set: { updatedAt: new Date() } }
    )

    await collection.updateOne(
      { _id: new ObjectId(relatedDropId) },
      { $addToSet: { relatedDrops: new ObjectId(id) }, $set: { updatedAt: new Date() } }
    )

    return true
  },

  async addRelatedDropsBatch(dropId, relatedDropIds) {
    const db = database.getDb()
    const collection = db.collection(COLLECTION)

    const objectIds = relatedDropIds.map(id => new ObjectId(id))

    await collection.updateOne(
      { _id: dropId },
      { $addToSet: { relatedDrops: { $each: objectIds } } }
    )

    await collection.updateMany(
      { _id: { $in: objectIds } },
      { $addToSet: { relatedDrops: dropId } }
    )
  },

  async getRelatedDrops(id) {
    const db = database.getDb()
    const collection = db.collection(COLLECTION)

    const drop = await collection.findOne({ _id: new ObjectId(id) })
    if (!drop || !drop.relatedDrops || drop.relatedDrops.length === 0) {
      return []
    }

    return collection.find({ _id: { $in: drop.relatedDrops } }).toArray()
  },

  async getStats(userId) {
    const db = database.getDb()
    const collection = db.collection(COLLECTION)

    const pipeline = [
      { $match: { createdBy: new ObjectId(userId) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          mastered: {
            $sum: { $cond: [{ $gte: ['$recallCount', 5] }, 1, 0] },
          },
          pending: {
            $sum: { $cond: [{ $lte: ['$nextRecallDate', new Date()] }, 1, 0] },
          },
          favorite: { $sum: { $cond: ['$isFavorite', 1, 0] } },
          byType: { $push: { type: '$type', count: 1 } },
        },
      },
    ]

    const result = await collection.aggregate(pipeline).toArray()

    if (result.length === 0) {
      return { total: 0, mastered: 0, pending: 0, favorite: 0, byType: {} }
    }

    const byType = {}
    for (const item of result[0].byType) {
      byType[item.type] = (byType[item.type] || 0) + 1
    }

    return {
      total: result[0].total,
      mastered: result[0].mastered,
      pending: result[0].pending,
      favorite: result[0].favorite,
      byType,
    }
  },

  async toggleFavorite(id, userId) {
    const db = database.getDb()
    const collection = db.collection(COLLECTION)

    const drop = await collection.findOne({ _id: new ObjectId(id), createdBy: new ObjectId(userId) })
    if (!drop) {
      throw new Error('Drop not found')
    }

    const newValue = !drop.isFavorite
    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { isFavorite: newValue, updatedAt: new Date() } }
    )

    return { isFavorite: newValue }
  },

  async bulkAction(userId, ids, action, options = {}) {
    const db = database.getDb()
    const session = db.client.startSession()
    const objectIds = ids.map(id => new ObjectId(id))

    try {
      let result
      await session.withTransaction(async () => {
        const collection = db.collection(COLLECTION)
        const recallHistoryCollection = db.collection('recallHistory')
        const collectionsCollection = db.collection('collections')

        const ownedDrops = await collection
          .find({ _id: { $in: objectIds }, createdBy: new ObjectId(userId) }, { session })
          .project({ _id: 1, relatedDrops: 1 })
          .toArray()

        if (ownedDrops.length !== objectIds.length) {
          throw new Error('One or more drops were not found or access denied')
        }

        if (action === 'delete') {
          await recallHistoryCollection.deleteMany({ dropId: { $in: objectIds } }, { session })
          await collectionsCollection.updateMany(
            { drops: { $in: objectIds } },
            { $pull: { drops: { $in: objectIds } } },
            { session }
          )
          await collection.updateMany(
            { relatedDrops: { $in: objectIds } },
            { $pull: { relatedDrops: { $in: objectIds } } },
            { session }
          )
          const deleteResult = await collection.deleteMany({ _id: { $in: objectIds } }, { session })
          result = { deletedCount: deleteResult.deletedCount }
        } else if (action === 'visibility') {
          const updateResult = await collection.updateMany(
            { _id: { $in: objectIds }, createdBy: new ObjectId(userId) },
            { $set: { visibility: options.visibility, updatedAt: new Date() } },
            { session }
          )
          result = { modifiedCount: updateResult.modifiedCount }
        } else if (action === 'addToCollection') {
          const targetCollection = await collectionsCollection.findOne(
            { _id: new ObjectId(options.collectionId), createdBy: new ObjectId(userId) },
            { session }
          )
          if (!targetCollection) {
            throw new Error('Target collection not found or access denied')
          }
          await collectionsCollection.updateOne(
            { _id: new ObjectId(options.collectionId) },
            { $addToSet: { drops: { $each: objectIds } }, $set: { updatedAt: new Date() } },
            { session }
          )
          result = { addedCount: objectIds.length }
        } else {
          throw new Error('Unsupported bulk action')
        }
      })

      return result
    } finally {
      await session.endSession()
    }
  },
}

export default dropModel