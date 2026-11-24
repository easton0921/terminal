const Joi = require("joi")

const password = Joi.string()
  .min(8)
  .max(72)
  .custom((value, helpers) => {
    if (Buffer.byteLength(value, "utf8") > 72) {
      return helpers.error("string.max", { limit: 72 })
    }

    return value
  })
  .required()
const email = Joi.string().trim().email().max(254).lowercase().required()

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email,
  password,
}).unknown(false)

const loginSchema = Joi.object({
  email,
  password: Joi.string().required(),
}).unknown(false)

const sendOtpSchema = Joi.object({ email }).unknown(false)

const verifyOtpSchema = Joi.object({
  email,
  otp: Joi.string().pattern(/^\d{6}$/).required(),
}).unknown(false)

const verifyEmailSchema = Joi.object({
  token: Joi.string().length(64).hex().required(),
}).unknown(false)

const resetPasswordSchema = Joi.object({
  email,
  otp: Joi.string().pattern(/^\d{6}$/).required(),
  newPassword: password,
}).unknown(false)

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: password,
}).unknown(false)

module.exports = {
  registerSchema,
  loginSchema,
  sendOtpSchema,
  verifyOtpSchema,
  verifyEmailSchema,
  resetPasswordSchema,
  changePasswordSchema,
}
