import Joi from 'joi'
import dropModel from '../models/dropModel.js'
import userModel from '../models/userModel.js'
import errorHandlerModule from '../middleware/errorHandler.js'
import loggerModule from '../middleware/logger.js'

const { AppError } = errorHandlerModule
const { logger } = loggerModule

const createDropSchema = Joi.object({
  title: Joi.string().min(1).max(100).required(),
  content: Joi.string().min(1).required(),
  type: Joi.string().valid('code', 'command', 'link', 'note'),
  language: Joi.string().max(50),
  tags: Joi.array().items(Joi.string().max(30)).max(5),
  visibility: Joi.string().valid('public', 'private'),
  isFavorite: Joi.boolean(),
})

const updateDropSchema = Joi.object({
  title: Joi.string().min(1).max(100),
  content: Joi.string().min(1),
  type: Joi.string().valid('code', 'command', 'link', 'note'),
  language: Joi.string().max(50).allow(null, ''),
  tags: Joi.array().items(Joi.string().max(30)).max(5),
  visibility: Joi.string().valid('public', 'private'),
  isFavorite: Joi.boolean(),
}).min(1)

const recallSchema = Joi.object({
  recallType: Joi.string().valid('manual', 'scheduled', 'quick'),
  confidence: Joi.number().integer().min(1).max(5),
})

const relateSchema = Joi.object({
  relatedDropId: Joi.string().required(),
})

const bulkActionSchema = Joi.object({
  ids: Joi.array().items(Joi.string()).min(1).max(100).required(),
  action: Joi.string().valid('delete', 'visibility', 'addToCollection').required(),
  visibility: Joi.string().valid('public', 'private').when('action', {
    is: 'visibility',
    then: Joi.required(),
  }),
  collectionId: Joi.string().when('action', {
    is: 'addToCollection',
    then: Joi.required(),
  }),
})

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

const dropController = {
  getAll: (req, res) => {
    const userId = req.user._id
    const page = parseInt(req.query.page) || 1
    const limit = Math.min(parseInt(req.query.limit) || 8, 50)

    const filters = {
      type: req.query.type,
      visibility: req.query.visibility,
      tags: req.query.tags ? req.query.tags.split(',') : undefined,
      isFavorite: req.query.isFavorite,
      search: req.query.search,
      sort: req.query.sort,
    }

    dropModel.findAll(userId, filters, page, limit)
      .then(result => {
        res.json(result)
      })
      .catch(err => {
        logger.error('Get drops error', { error: err.message, userId: userId.toString() })
        res.status(500).json({ error: 'Failed to fetch drops' })
      })
  },

  getDueForRecall: (req, res) => {
    const userId = req.user._id
    const page = parseInt(req.query.page) || 1
    const limit = Math.min(parseInt(req.query.limit) || 8, 50)

    dropModel.findDueForRecall(userId, page, limit)
      .then(result => {
        res.json(result)
      })
      .catch(err => {
        logger.error('Get recall drops error', { error: err.message, userId: userId.toString() })
        res.status(500).json({ error: 'Failed to fetch recall drops' })
      })
  },

  getRelated: (req, res) => {
    const dropId = req.params.id

    dropModel.getRelatedDrops(dropId)
      .then(relatedDrops => {
        res.json({ relatedDrops })
      })
      .catch(err => {
        logger.error('Get related drops error', { error: err.message, dropId })
        res.status(500).json({ error: 'Failed to fetch related drops' })
      })
  },

  create: (req, res) => {
    const userId = req.user._id
    const dropData = req.validatedBody

    dropModel.create(dropData, userId)
      .then(drop => {
        logger.info('Drop created', { userId: userId.toString(), dropId: drop._id.toString() })
        res.status(201).json({
          message: 'Drop created successfully',
          drop,
        })
      })
      .catch(err => {
        if (err.message.includes('required') || err.message.includes('must be') || err.message.includes('Invalid')) {
          return res.status(400).json({ error: err.message })
        }
        logger.error('Create drop error', { error: err.message, userId: userId.toString() })
        res.status(500).json({ error: 'Failed to create drop' })
      })
  },

  markRecalled: (req, res) => {
    const dropId = req.params.id
    const userId = req.user._id
    const { recallType, confidence } = req.validatedBody

    dropModel.markRecalled(dropId, userId, recallType || 'manual', confidence || 3)
      .then(result => {
        logger.info('Drop recalled', { userId: userId.toString(), dropId, ...result })
        res.json({
          message: 'Drop recalled successfully',
          ...result,
        })
      })
      .catch(err => {
        if (err.message === 'Drop not found') {
          return res.status(404).json({ error: err.message })
        }
        logger.error('Mark recalled error', { error: err.message, dropId, userId: userId.toString() })
        res.status(500).json({ error: 'Failed to mark drop as recalled' })
      })
  },

  addRelated: (req, res) => {
    const dropId = req.params.id
    const userId = req.user._id
    const { relatedDropId } = req.validatedBody

    dropModel.addRelatedDrop(dropId, userId, relatedDropId)
      .then(() => {
        logger.info('Related drop added', { userId: userId.toString(), dropId, relatedDropId })
        res.json({ message: 'Related drop added successfully' })
      })
      .catch(err => {
        if (err.message.includes('not found') || err.message.includes('already') || err.message.includes('itself')) {
          return res.status(400).json({ error: err.message })
        }
        if (err.message === 'Drop not found') {
          return res.status(404).json({ error: err.message })
        }
        logger.error('Add related drop error', { error: err.message, dropId, userId: userId.toString() })
        res.status(500).json({ error: 'Failed to add related drop' })
      })
  },

  update: (req, res) => {
    const dropId = req.params.id
    const userId = req.user._id
    const updateData = req.validatedBody

    dropModel.update(dropId, userId, updateData)
      .then(result => {
        if (!result) {
          throw new AppError('Drop not found', 404)
        }
        logger.info('Drop updated', { userId: userId.toString(), dropId })
        res.json({
          message: 'Drop updated successfully',
          drop: result,
        })
      })
      .catch(err => {
        if (err.message.includes('required') || err.message.includes('must be') || err.message.includes('Invalid')) {
          return res.status(400).json({ error: err.message })
        }
        if (err.message === 'Drop not found') {
          return res.status(404).json({ error: err.message })
        }
        logger.error('Update drop error', { error: err.message, dropId, userId: userId.toString() })
        res.status(500).json({ error: 'Failed to update drop' })
      })
  },

  delete: (req, res) => {
    const dropId = req.params.id
    const userId = req.user._id

    dropModel.delete(dropId, userId)
      .then(deleted => {
        if (!deleted) {
          throw new AppError('Drop not found', 404)
        }
        logger.info('Drop deleted', { userId: userId.toString(), dropId })
        res.json({ message: 'Drop deleted successfully' })
      })
      .catch(err => {
        if (err.message === 'Drop not found') {
          return res.status(404).json({ error: err.message })
        }
        logger.error('Delete drop error', { error: err.message, dropId, userId: userId.toString() })
        res.status(500).json({ error: 'Failed to delete drop' })
      })
  },

  getStats: (req, res) => {
    const userId = req.user._id

    Promise.all([
      dropModel.getStats(userId),
      userModel.calculateStreak(userId),
      userModel.getStats(userId),
    ])
      .then(([dropStats, currentStreak, userStats]) => {
        res.json({
          stats: {
            totalDrops: dropStats.total,
            mastered: dropStats.mastered,
            dueForRecall: dropStats.pending,
            favoriteCount: dropStats.favorite,
            byType: dropStats.byType,
            currentStreak,
            totalCollections: userStats.totalCollections,
          },
        })
      })
      .catch(err => {
        logger.error('Get stats error', { error: err.message, userId: userId.toString() })
        res.status(500).json({ error: 'Failed to fetch stats' })
      })
  },

  getById: (req, res) => {
    const dropId = req.params.id
    const userId = req.user._id

    dropModel.findByIdWithRelations(dropId, userId)
      .then(drop => {
        if (!drop) {
          return res.status(404).json({ error: 'Drop not found' })
        }
        res.json({ drop })
      })
      .catch(err => {
        logger.error('Get drop error', { error: err.message, dropId, userId: userId.toString() })
        res.status(500).json({ error: 'Failed to fetch drop' })
      })
  },

  toggleFavorite: (req, res) => {
    const dropId = req.params.id
    const userId = req.user._id

    dropModel.toggleFavorite(dropId, userId)
      .then(result => {
        res.json(result)
      })
      .catch(err => {
        if (err.message === 'Drop not found') {
          return res.status(404).json({ error: err.message })
        }
        logger.error('Toggle favorite error', { error: err.message, dropId, userId: userId.toString() })
        res.status(500).json({ error: 'Failed to toggle favorite' })
      })
  },

  bulkAction: (req, res) => {
    const userId = req.user._id
    const { ids, action, visibility, collectionId } = req.validatedBody

    dropModel.bulkAction(userId, ids, action, { visibility, collectionId })
      .then(result => {
        logger.info('Bulk drop action completed', { userId: userId.toString(), action, count: ids.length })
        res.json({ message: 'Bulk action completed successfully', ...result })
      })
      .catch(err => {
        if (err.message.includes('not found') || err.message.includes('access denied')) {
          return res.status(400).json({ error: err.message })
        }
        logger.error('Bulk drop action error', { error: err.message, userId: userId.toString(), action })
        res.status(500).json({ error: 'Failed to complete bulk action' })
      })
  },
}

export default {
  dropController,
  validate,
  createDropSchema,
  updateDropSchema,
  recallSchema,
  relateSchema,
  bulkActionSchema,
}
