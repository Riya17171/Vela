import * as yup from 'yup'

export const addressSchema = yup.object({
  fullName: yup.string().trim().required('Full name is required').min(2).max(100),
  phone: yup.string().trim().required('Phone is required').matches(/^\+?[0-9\s-]{7,20}$/, 'Enter a valid phone number'),
  line1: yup.string().trim().required('Address is required').min(3, 'Address is too short').max(200),
  line2: yup.string().trim().max(200),
  city: yup.string().trim().required('City is required').min(2).max(100),
  state: yup.string().trim().required('State is required').min(2).max(100),
  postalCode: yup.string().trim().required('Postal code is required').matches(/^[A-Za-z0-9\s-]{3,12}$/, 'Enter a valid postal code'),
  country: yup.string().trim().uppercase().length(2, 'Use a 2-letter code').default('IN'),
})

export const profileSchema = yup.object({
  fullName: yup.string().trim().required('Full name is required').min(2).max(100),
  phone: yup
    .string()
    .trim()
    .test('phone', 'Enter a valid phone number', (value) => !value || /^\+?[0-9\s-]{7,20}$/.test(value)),
})

/** Drops empty optional strings so the API's strict schemas accept the payload. */
export function compactAddress(values) {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== '' && value !== undefined && value !== null))
}
