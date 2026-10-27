import * as yup from 'yup'

// Mirrors the backend rules (backend/src/validators/common.js) for instant feedback.
// The server re-validates everything; these exist purely for user experience.
export const passwordRule = yup
  .string()
  .required('Password is required')
  .min(8, 'At least 8 characters')
  .max(128, 'At most 128 characters')
  .matches(/[a-z]/, 'Include a lowercase letter')
  .matches(/[A-Z]/, 'Include an uppercase letter')
  .matches(/\d/, 'Include a number')

const emailRule = yup.string().trim().required('Email is required').email('Enter a valid email address')

export const loginSchema = yup.object({
  email: emailRule,
  password: yup.string().required('Password is required'),
})

export const registerSchema = yup.object({
  fullName: yup.string().trim().required('Full name is required').min(2, 'Full name is too short').max(100),
  email: emailRule,
  password: passwordRule,
})

export const forgotPasswordSchema = yup.object({ email: emailRule })

export const resetPasswordSchema = yup.object({
  password: passwordRule,
  confirmPassword: yup.string().required('Confirm your password').oneOf([yup.ref('password')], 'Passwords do not match'),
})

export const changePasswordSchema = yup.object({
  currentPassword: yup.string().required('Current password is required'),
  newPassword: passwordRule.notOneOf([yup.ref('currentPassword')], 'Choose a new password'),
  confirmPassword: yup.string().required('Confirm your new password').oneOf([yup.ref('newPassword')], 'Passwords do not match'),
})
