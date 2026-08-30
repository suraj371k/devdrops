import collectionModel from '../models/collectionModel.js'
import dropModel from '../models/dropModel.js'
import errorHandlerModule from '../middleware/errorHandler.js'
import loggerModule from '../middleware/logger.js'

const { AppError } = errorHandlerModule
const { logger } = loggerModule

const publicController = {
  getSharedCollection: (req, res) => {
    const { token } = req.params

    collectionModel.findByShareToken(token)
      .then(collection => {
        if (!collection) {
          throw new AppError('Shared collection not found', 404)
        }
        return collectionModel.findWithDrops(collection._id, collection.createdBy)
      })
      .then(collection => {
        res.json({ collection })
      })
      .catch(err => {
        if (err.statusCode) {
          return res.status(err.statusCode).json({ error: err.message })
        }
        logger.error('Get shared collection error', { error: err.message, token })
        res.status(500).json({ error: 'Failed to fetch shared collection' })
      })
  },

  explorePublicDrops: (req, res) => {
    const page = parseInt(req.query.page) || 1
    const limit = Math.min(parseInt(req.query.limit) || 8, 50)

    const filters = {
      type: req.query.type,
      language: req.query.language,
      tags: req.query.tags ? req.query.tags.split(',') : undefined,
      search: req.query.search,
      sort: req.query.sort,
    }

    dropModel.findPublic(filters, page, limit)
      .then(result => {
        res.json(result)
      })
      .catch(err => {
        logger.error('Explore public drops error', { error: err.message })
        res.status(500).json({ error: 'Failed to fetch public drops' })
      })
  },
}

export default {
  publicController,
}
