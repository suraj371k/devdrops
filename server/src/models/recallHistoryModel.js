import { ObjectId } from 'mongodb'
import database from '../db/connection.js'

const COLLECTION = 'recallHistory'

const recallHistoryModel = {
  async create(historyData) {
    const db = database.getDb()
    const collection = db.collection(COLLECTION)

    const { dropId, userId, recallType, confidence } = historyData

    if (!dropId || !userId) {
      throw new Error('dropId and userId are required')
    }

    if (recallType && !['manual', 'scheduled'].includes(recallType)) {
      throw new Error('Invalid recall type')
    }

    const confidenceValue = confidence || 3
    if (confidenceValue < 1 || confidenceValue > 5) {
      throw new Error('Confidence must be between 1 and 5')
    }

    const history = {
      dropId: new ObjectId(dropId),
      userId: new ObjectId(userId),
      recalledAt: new Date(),
      recallType: recallType || 'manual',
      confidence: confidenceValue,
    }

    const result = await collection.insertOne(history)
    return { ...history, _id: result.insertedId }
  },

  async findByDropId(dropId, userId, limit = 50) {
    const db = database.getDb()
    const collection = db.collection(COLLECTION)

    return collection.find({ dropId: new ObjectId(dropId), userId: new ObjectId(userId) })
      .sort({ recalledAt: -1 })
      .limit(limit)
      .toArray()
  },

  async findByUserId(userId, filters = {}, page = 1, limit = 20) {
    const db = database.getDb()
    const collection = db.collection(COLLECTION)

    const query = { userId: new ObjectId(userId) }

    if (filters.dropId) {
      query.dropId = new ObjectId(filters.dropId)
    }
    if (filters.recallType) {
      query.recallType = filters.recallType
    }
    if (filters.fromDate || filters.toDate) {
      query.recalledAt = {}
      if (filters.fromDate) query.recalledAt.$gte = new Date(filters.fromDate)
      if (filters.toDate) query.recalledAt.$lte = new Date(filters.toDate)
    }

    const skip = (page - 1) * limit

    const [history, total] = await Promise.all([
      collection.find(query).sort({ recalledAt: -1 }).skip(skip).limit(limit).toArray(),
      collection.countDocuments(query),
    ])

    return {
      history,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  },

  async getStats(userId) {
    const db = database.getDb()
    const collection = db.collection(COLLECTION)

    const pipeline = [
      { $match: { userId: new ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalRecalls: { $sum: 1 },
          manualRecalls: {
            $sum: { $cond: [{ $eq: ['$recallType', 'manual'] }, 1, 0] },
          },
          scheduledRecalls: {
            $sum: { $cond: [{ $eq: ['$recallType', 'scheduled'] }, 1, 0] },
          },
          avgConfidence: { $avg: '$confidence' },
          byDay: {
            $push: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$recalledAt' } },
            },
          },
        },
      },
    ]

    const result = await collection.aggregate(pipeline).toArray()

    if (result.length === 0) {
      return {
        totalRecalls: 0,
        manualRecalls: 0,
        scheduledRecalls: 0,
        avgConfidence: 0,
        recallsPerDay: {},
      }
    }

    const recallsPerDay = {}
    for (const item of result[0].byDay) {
      recallsPerDay[item.date] = (recallsPerDay[item.date] || 0) + 1
    }

    return {
      totalRecalls: result[0].totalRecalls,
      manualRecalls: result[0].manualRecalls,
      scheduledRecalls: result[0].scheduledRecalls,
      avgConfidence: Math.round(result[0].avgConfidence * 10) / 10,
      recallsPerDay,
    }
  },

  async getRecentActivity(userId, days = 7) {
    const db = database.getDb()
    const collection = db.collection(COLLECTION)

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    const pipeline = [
      {
        $match: {
          userId: new ObjectId(userId),
          recalledAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$recalledAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]

    return collection.aggregate(pipeline).toArray()
  },

  async deleteByDropId(dropId) {
    const db = database.getDb()
    const collection = db.collection(COLLECTION)
    return collection.deleteMany({ dropId: new ObjectId(dropId) })
  },
}

export default recallHistoryModel