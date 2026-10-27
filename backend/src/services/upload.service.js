import crypto from 'node:crypto'

import { v2 as cloudinary } from 'cloudinary'

import { env } from '../config/env.js'
import { logger } from '../config/logger.js'
import { ApiError } from '../utils/ApiError.js'

if (env.uploadsEnabled) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  })
}

const SIGNATURES = [
  { type: 'image/jpeg', ext: 'jpg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { type: 'image/png', ext: 'png', test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { type: 'image/webp', ext: 'webp', test: (b) => b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP' },
]

/** Identifies the image from its magic bytes; the client-supplied MIME type is not trusted. */
export function detectImageType(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null
  return SIGNATURES.find((signature) => signature.test(buffer)) ?? null
}

export async function uploadProductImage(file) {
  if (!env.uploadsEnabled) {
    throw ApiError.serviceUnavailable(
      'Image uploads are not configured. Set the CLOUDINARY_* variables, or paste an existing image URL instead.',
      { code: 'UPLOADS_DISABLED' },
    )
  }
  if (!file?.buffer) throw ApiError.badRequest('Attach an image file in the "image" field')

  const detected = detectImageType(file.buffer)
  if (!detected) throw ApiError.badRequest('Only JPEG, PNG or WebP images are accepted', { code: 'INVALID_FILE_TYPE' })

  const publicId = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`
  try {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: env.CLOUDINARY_FOLDER, public_id: publicId, resource_type: 'image', overwrite: false },
        (error, uploaded) => (error ? reject(error) : resolve(uploaded)),
      )
      stream.end(file.buffer)
    })
    return { url: result.secure_url, storageId: result.public_id, width: result.width, height: result.height, format: detected.ext }
  } catch (error) {
    logger.error({ err: error }, 'Cloudinary upload failed')
    throw ApiError.badGateway('Image storage rejected the upload. Please try again.', { code: 'UPLOAD_FAILED' })
  }
}
