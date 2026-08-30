import database from '../db/connection.js'
import tagService from './tagService.js'
import { ObjectId } from 'mongodb'

async function findRelatedDrops(userId, content, tags, type, limit = 5) {
  const db = database.getDb()
  const collection = db.collection('drops')

  const keywords = tagService.extractKeywords(content, 10)
  const searchTerms = [...new Set([...tags, ...keywords])]

  if (searchTerms.length === 0) return []

  const query = {
    createdBy: new ObjectId(userId),
    $or: [
      { tags: { $in: searchTerms } },
    ],
  }

  if (type) {
    query.type = type
  }

  try {
    const drops = await collection.find(query)
      .sort({ recallCount: -1, createdAt: -1 })
      .limit(limit)
      .project({ _id: 1 })
      .toArray()

    return drops.map(d => d._id.toString())
  } catch (error) {
    console.warn('findRelatedDrops error:', error.message)
    return []
  }
}

async function searchDrops(userId, searchQuery, filters = {}, page = 1, limit = 20) {
  const db = database.getDb()
  const collection = db.collection('drops')

  const query = { createdBy: new ObjectId(userId) }

  if (searchQuery) {
    query.$text = { $search: searchQuery }
  }

  if (filters.type) {
    query.type = filters.type
  }
  if (filters.visibility) {
    query.visibility = filters.visibility
  }
  if (filters.tags && Array.isArray(filters.tags) && filters.tags.length > 0) {
    query.tags = { $in: filters.tags }
  }
  if (filters.isFavorite !== undefined) {
    query.isFavorite = filters.isFavorite
  }
  if (filters.collectionId) {
    query._id = { $in: await getDropsInCollection(filters.collectionId, userId) }
  }

  const sort = {}
  switch (filters.sort) {
    case 'oldest':
      sort.createdAt = 1
      break
    case 'most_recalled':
      sort.recallCount = -1
      break
    case 'alphabetical':
      sort.title = 1
      break
    case 'recently_recalled':
      sort.lastRecalled = -1
      break
    default:
      sort.createdAt = -1
  }

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
}

async function getDropsInCollection(collectionId, userId) {
  const db = database.getDb()
  const collectionsCollection = db.collection('collections')

  const collection = await collectionsCollection.findOne(
    { _id: new ObjectId(collectionId), createdBy: new ObjectId(userId) },
    { projection: { drops: 1 } }
  )

  return collection?.drops || []
}

async function getSuggestedTags(userId, limit = 20) {
  const db = database.getDb()
  const collection = db.collection('drops')

  const pipeline = [
    { $match: { createdBy: new ObjectId(userId) } },
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
  ]

  return collection.aggregate(pipeline).toArray()
}

async function getSuggestedLanguages(userId) {
  const db = database.getDb()
  const collection = db.collection('drops')

  const pipeline = [
    { $match: { createdBy: new ObjectId(userId), language: { $ne: null } } },
    { $group: { _id: '$language', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]

  return collection.aggregate(pipeline).toArray()
}

export default {
  findRelatedDrops,
  searchDrops,
  getDropsInCollection,
  getSuggestedTags,
  getSuggestedLanguages,
}