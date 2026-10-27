import { Router } from 'express'

import * as categories from '../controllers/category.controller.js'
import { validate } from '../middlewares/validate.js'
import { categorySlugParams } from '../validators/category.validator.js'

const router = Router()

router.get('/', categories.listCategories)
router.get('/:slug', validate({ params: categorySlugParams }), categories.getCategory)

export default router
