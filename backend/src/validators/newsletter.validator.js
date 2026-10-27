import { z } from 'zod'

import { email } from './common.js'

export const subscribeBody = z.strictObject({ email })
