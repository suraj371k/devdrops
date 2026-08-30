import express from 'express'
import dropControllerModule from '../controllers/dropController.js'
import authModule from '../middleware/auth.js'
import ownershipModule from '../middleware/ownership.js'
import rateLimiterModule from '../middleware/rateLimiter.js'

const { dropController, validate, createDropSchema, updateDropSchema, recallSchema, relateSchema, bulkActionSchema } = dropControllerModule
const { authMiddleware } = authModule
const { checkDropOwnership, checkDropAccess } = ownershipModule
const { recallRateLimiter, generalRateLimiter } = rateLimiterModule

const router = express.Router()

router.use(authMiddleware)
router.use(generalRateLimiter)

router.get('/', dropController.getAll)
router.get('/recall', recallRateLimiter, dropController.getDueForRecall)
router.get('/stats', dropController.getStats)
router.get('/related/:id', checkDropAccess, dropController.getRelated)
router.get('/:id', checkDropAccess, dropController.getById)

router.post('/', validate(createDropSchema), dropController.create)
router.post('/bulk', validate(bulkActionSchema), dropController.bulkAction)
router.post('/:id/recall', recallRateLimiter, checkDropOwnership, validate(recallSchema), dropController.markRecalled)
router.post('/:id/relate', checkDropOwnership, validate(relateSchema), dropController.addRelated)

router.put('/:id', checkDropOwnership, validate(updateDropSchema), dropController.update)
router.put('/:id/favorite', checkDropOwnership, dropController.toggleFavorite)

router.delete('/:id', checkDropOwnership, dropController.delete)

export default router
