const { UniqueConstraintError } = require("sequelize")
const User = require("../models/user.model")
const { sendVerificationEmail } = require("../emails/verification.js")
const AppError = require("../utils/app-error")
const messages = require("../utils/messages")

async function getProfile(userId) {
  const user = await User.findByPk(userId, { raw: true })
  if (!user) throw new AppError(messages.common.userNotFound, 404)
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    created_at: user.created_at,
    updated_at: user.updated_at,
    role: user.role,
    email_verified: user.email_verified,
  }
}

async function updateProfile({ userId, name, email }) {
  try {
    const user = await User.findByPk(userId)
    if (!user) throw new AppError(messages.common.userNotFound, 404)
    const emailChanged = email !== undefined && email !== user.email
    await user.update({
      name: name ?? user.name,
      email: email ?? user.email,
      ...(emailChanged
        ? {
            email_verified: false,
            email_verification_token_hash: null,
            email_verification_expires_at: null,
          }
        : {}),
    })
    if (emailChanged) {
      await sendVerificationEmail(user)
    }
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      created_at: user.created_at,
      updated_at: user.updated_at,
      role: user.role,
      email_verified: user.email_verified,
    }
  } catch (error) {
    if (error instanceof UniqueConstraintError || error.original?.code === "23505") {
      throw new AppError(messages.common.emailAlreadyRegistered, 409)
    }
    throw error
  }
}

async function deleteAccount(userId) {
  const deletedCount = await User.destroy({ where: { id: userId } })
  if (deletedCount === 0) throw new AppError(messages.common.userNotFound, 404)
}

module.exports = { getProfile, updateProfile, deleteAccount }
