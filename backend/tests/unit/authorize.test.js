import { describe, expect, it, vi } from 'vitest'

import { authorize, isAuthorized } from '../../src/middlewares/authorize.js'
import { detectImageType } from '../../src/services/upload.service.js'

describe('authorize', () => {
  it('allows only listed roles', () => {
    expect(isAuthorized({ role: 'admin' }, ['admin'])).toBe(true)
    expect(isAuthorized({ role: 'user' }, ['admin'])).toBe(false)
    expect(isAuthorized(undefined, ['admin'])).toBe(false)
  })

  it('responds 403 for authenticated non-admins and 401 for anonymous requests', () => {
    const next = vi.fn()
    expect(() => authorize('admin')({ user: { role: 'user' } }, {}, next)).toThrow(expect.objectContaining({ statusCode: 403 }))
    expect(() => authorize('admin')({}, {}, next)).toThrow(expect.objectContaining({ statusCode: 401 }))
    authorize('admin')({ user: { role: 'admin' } }, {}, next)
    expect(next).toHaveBeenCalledOnce()
  })
})

describe('detectImageType', () => {
  it('identifies images by magic bytes, not by name or declared MIME type', () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0])
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0])
    const webp = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP')])
    expect(detectImageType(png)?.type).toBe('image/png')
    expect(detectImageType(jpeg)?.type).toBe('image/jpeg')
    expect(detectImageType(webp)?.type).toBe('image/webp')
    expect(detectImageType(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'))).toBeNull()
    expect(detectImageType(Buffer.from('#!/bin/sh\necho pwned'))).toBeNull()
  })
})
