import express from 'express'
import collectionControllerModule from '../controllers/collectionController.js'
import authModule from '../middleware/auth.js'
import ownershipModule from '../middleware/ownership.js'
import rateLimiterModule from '../middleware/rateLimiter.js'

const { collectionController, validate, createCollectionSchema, updateCollectionSchema } = collectionControllerModule
const { authMiddleware } = authModule
const { checkCollectionOwnership, checkCollectionAccess } = ownershipModule
const { generalRateLimiter } = rateLimiterModule

const router = express.Router()

router.use(authMiddleware)
router.use(generalRateLimiter)

router.get('/', collectionController.getAll)
router.get('/:id', checkCollectionAccess, collectionController.getById)
router.get('/:id/share', checkCollectionOwnership, collectionController.generateShareToken)

router.post('/', validate(createCollectionSchema), collectionController.create)
router.post('/:id/drops', checkCollectionOwnership, collectionController.addDrop)

router.put('/:id', checkCollectionOwnership, validate(updateCollectionSchema), collectionController.update)

router.delete('/:id', checkCollectionOwnership, collectionController.delete)
router.delete('/:id/drops/:dropId', checkCollectionOwnership, collectionController.removeDrop)

export default router