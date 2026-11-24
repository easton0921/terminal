const Joi = require("joi")

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  email: Joi.string().trim().email().max(254).lowercase(),
}).min(1).unknown(false)

module.exports = { updateProfileSchema }
