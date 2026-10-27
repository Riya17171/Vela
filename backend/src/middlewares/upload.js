import multer from 'multer'

import { env } from '../config/env.js'
import { ApiError } from '../utils/ApiError.js'

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp'])

// Files stay in memory and go straight to object storage; nothing is written to local disk.
export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: Math.round(env.MAX_UPLOAD_MB * 1024 * 1024), files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED.has(file.mimetype)) {
      callback(ApiError.badRequest('Only JPEG, PNG or WebP images are accepted', { code: 'INVALID_FILE_TYPE' }))
      return
    }
    callback(null, true)
  },
}).single('image')
