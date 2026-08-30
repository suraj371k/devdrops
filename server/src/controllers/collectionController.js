import Joi from 'joi'
import collectionModel from '../models/collectionModel.js'
import dropModel from '../models/dropModel.js'
import errorHandlerModule from '../middleware/errorHandler.js'
import loggerModule from '../middleware/logger.js'

const { AppError } = errorHandlerModule
const { logger } = loggerModule

const createCollectionSchema = Joi.object({
  name: Joi.string().min(1).max(50).required(),
  description: Joi.string().max(200).allow(''),
  color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/),
  isShared: Joi.boolean(),
})

const updateCollectionSchema = Joi.object({
  name: Joi.string().min(1).max(50),
  description: Joi.string().max(200).allow(''),
  color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/),
  isShared: Joi.boolean(),
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

const collectionController = {
  getAll: (req, res) => {
    const userId = req.user._id

    collectionModel.findAll(userId)
      .then(collections => {
        res.json({ collections })
      })
      .catch(err => {
        logger.error('Get collections error', { error: err.message, userId: userId.toString() })
        res.status(500).json({ error: 'Failed to fetch collections' })
      })
  },

  getById: (req, res) => {
    const collectionId = req.params.id
    const userId = req.user._id

    collectionModel.findWithDrops(collectionId, userId)
      .then(collection => {
        if (!collection) {
          throw new AppError('Collection not found', 404)
        }
        res.json({ collection })
      })
      .catch(err => {
        if (err.statusCode) throw err
        logger.error('Get collection error', { error: err.message, collectionId, userId: userId.toString() })
        res.status(500).json({ error: 'Failed to fetch collection' })
      })
  },

  create: (req, res) => {
    const userId = req.user._id
    const collectionData = req.validatedBody

    collectionModel.create(collectionData, userId)
      .then(collection => {
        logger.info('Collection created', { userId: userId.toString(), collectionId: collection._id.toString() })
        res.status(201).json({
          message: 'Collection created successfully',
          collection,
        })
      })
      .catch(err => {
        if (err.message.includes('required') || err.message.includes('already exists') || err.message.includes('must be')) {
          return res.status(400).json({ error: err.message })
        }
        logger.error('Create collection error', { error: err.message, userId: userId.toString() })
        res.status(500).json({ error: 'Failed to create collection' })
      })
  },

  update: (req, res) => {
    const collectionId = req.params.id
    const userId = req.user._id
    const updateData = req.validatedBody

    collectionModel.update(collectionId, userId, updateData)
      .then(result => {
        if (!result) {
          throw new AppError('Collection not found', 404)
        }
        logger.info('Collection updated', { userId: userId.toString(), collectionId })
        res.json({
          message: 'Collection updated successfully',
          collection: result,
        })
      })
      .catch(err => {
        if (err.message.includes('required') || err.message.includes('already exists') || err.message.includes('Invalid') || err.message.includes('must be')) {
          return res.status(400).json({ error: err.message })
        }
        if (err.message === 'Collection not found') {
          return res.status(404).json({ error: err.message })
        }
        logger.error('Update collection error', { error: err.message, collectionId, userId: userId.toString() })
        res.status(500).json({ error: 'Failed to update collection' })
      })
  },

  delete: (req, res) => {
    const collectionId = req.params.id
    const userId = req.user._id

    collectionModel.delete(collectionId, userId)
      .then(deleted => {
        if (!deleted) {
          throw new AppError('Collection not found', 404)
        }
        logger.info('Collection deleted', { userId: userId.toString(), collectionId })
        res.json({ message: 'Collection deleted successfully' })
      })
      .catch(err => {
        if (err.message === 'Collection not found') {
          return res.status(404).json({ error: err.message })
        }
        logger.error('Delete collection error', { error: err.message, collectionId, userId: userId.toString() })
        res.status(500).json({ error: 'Failed to delete collection' })
      })
  },

  addDrop: (req, res) => {
    const collectionId = req.params.id
    const userId = req.user._id
    const { dropId } = req.body

    if (!dropId) {
      return res.status(400).json({ error: 'dropId is required' })
    }

    collectionModel.addDrop(collectionId, userId, dropId)
      .then(() => {
        logger.info('Drop added to collection', { userId: userId.toString(), collectionId, dropId })
        res.json({ message: 'Drop added to collection successfully' })
      })
      .catch(err => {
        if (err.message.includes('not found') || err.message.includes('already')) {
          return res.status(400).json({ error: err.message })
        }
        logger.error('Add drop to collection error', { error: err.message, collectionId, userId: userId.toString() })
        res.status(500).json({ error: 'Failed to add drop to collection' })
      })
  },

  removeDrop: (req, res) => {
    const collectionId = req.params.id
    const dropId = req.params.dropId
    const userId = req.user._id

    collectionModel.removeDrop(collectionId, userId, dropId)
      .then(() => {
        logger.info('Drop removed from collection', { userId: userId.toString(), collectionId, dropId })
        res.json({ message: 'Drop removed from collection successfully' })
      })
      .catch(err => {
        if (err.message === 'Collection not found') {
          return res.status(404).json({ error: err.message })
        }
        logger.error('Remove drop from collection error', { error: err.message, collectionId, userId: userId.toString() })
        res.status(500).json({ error: 'Failed to remove drop from collection' })
      })
  },

  generateShareToken: (req, res) => {
    const collectionId = req.params.id
    const userId = req.user._id

    collectionModel.generateShareToken(collectionId, userId)
      .then(token => {
        const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/shared/${token}`
        logger.info('Share token generated', { userId: userId.toString(), collectionId })
        res.json({
          message: 'Share link generated',
          shareToken: token,
          shareUrl,
        })
      })
      .catch(err => {
        if (err.message === 'Collection not found') {
          return res.status(404).json({ error: err.message })
        }
        logger.error('Generate share token error', { error: err.message, collectionId, userId: userId.toString() })
        res.status(500).json({ error: 'Failed to generate share link' })
      })
  },

  revokeShareToken: (req, res) => {
    const collectionId = req.params.id
    const userId = req.user._id

    collectionModel.revokeShareToken(collectionId, userId)
      .then(() => {
        logger.info('Share token revoked', { userId: userId.toString(), collectionId })
        res.json({ message: 'Share link revoked successfully' })
      })
      .catch(err => {
        if (err.message === 'Collection not found') {
          return res.status(404).json({ error: err.message })
        }
        logger.error('Revoke share token error', { error: err.message, collectionId, userId: userId.toString() })
        res.status(500).json({ error: 'Failed to revoke share link' })
      })
  },
}

export default {
  collectionController,
  validate,
  createCollectionSchema,
  updateCollectionSchema,
}