const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const crypto = require("crypto")
const { Op, UniqueConstraintError } = require("sequelize")
const User = require("../models/user.model")
const PasswordResetOtp = require("../models/otp.model")
const { sendVerificationEmail } = require("../emails/verification.js")
const passwordResetEmail = require("../emails/password-reset")
const AppError = require("../utils/app-error")
const messages = require("../utils/messages")
const ROLES = require("../utils/roles")

const BCRYPT_ROUNDS = 12
const OTP_TTL_MS = 10 * 60 * 1000
function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new AppError(messages.auth.jwtSecretNotConfigured, 500)
  }
  if (Buffer.byteLength(process.env.JWT_SECRET, "utf8") < 32) {
    throw new AppError(messages.auth.jwtSecretTooShort, 500)
  }
  return process.env.JWT_SECRET
}

function createAccessToken(user) {
  return jwt.sign(
    { sub: String(user.id), email: user.email, role: user.role || ROLES.USER },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || "1h" },
  )
}

async function register({ name, email, password }) {
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)
  let user

  try {
    user = await User.create({
      name,
      email,
      password_hash: passwordHash,
      email_verified: false,
    })
  } catch (error) {
    if (error instanceof UniqueConstraintError || error.original?.code === "23505") {
      throw new AppError(messages.common.emailAlreadyRegistered, 409)
    }
    throw error
  }

  await sendVerificationEmail(user)
  return { user: toPublicUser(user) }
}

async function login({ email, password }) {
  const user = await User.findOne({ where: { email }, raw: true })
  if (!user) {
    throw new AppError(messages.auth.invalidCredentials, 401)
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash)
  if (!passwordMatches) {
    throw new AppError(messages.auth.invalidCredentials, 401)
  }
  if (!user.email_verified) {
    throw new AppError(messages.auth.emailNotVerified, 403)
  }

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      created_at: user.created_at,
      updated_at: user.updated_at,
      role: user.role,
    },
    accessToken: createAccessToken(user),
  }
}

async function verifyEmail(token) {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex")
  const [updatedCount, users] = await User.update(
    {
      email_verified: true,
      email_verification_token_hash: null,
      email_verification_expires_at: null,
    },
    {
      where: {
        email_verification_token_hash: tokenHash,
        email_verification_expires_at: { [Op.gt]: new Date() },
        email_verified: false,
      },
      returning: true,
    },
  )

  if (updatedCount === 0) {
    throw new AppError(messages.auth.emailVerificationInvalidOrExpired, 400)
  }
  return toPublicUser(users[0])
}

async function changePassword({ userId, currentPassword, newPassword }) {
  const user = await User.findByPk(userId)
  if (!user) throw new AppError(messages.common.userNotFound, 404)

  const passwordMatches = await bcrypt.compare(currentPassword, user.password_hash)
  if (!passwordMatches) {
    throw new AppError(messages.auth.currentPasswordIncorrect, 401)
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS)
  await user.update({ password_hash: passwordHash })
  return toPublicUser(user)
}

async function sendPasswordResetOtp(email) {
  const user = await User.findOne({ where: { email }, attributes: ["id"] })
  if (!user) {
    return
  }

  const otp = crypto.randomInt(100000, 1000000).toString()
  const otpHash = await bcrypt.hash(otp, BCRYPT_ROUNDS)
  await PasswordResetOtp.upsert({
    email,
    otp_hash: otpHash,
    expires_at: new Date(Date.now() + OTP_TTL_MS),
    attempts: 0,
    verified: false,
    created_at: new Date(),
  })
  await passwordResetEmail.sendPasswordResetOtp(email, otp)
}

async function verifyPasswordResetOtp({ email, otp }) {
  const record = await PasswordResetOtp.findByPk(email, { raw: true })
  if (!record) throw new AppError(messages.auth.otpInvalidOrExpired, 400)
  if (record.attempts >= 5) throw new AppError(messages.auth.tooManyOtpAttempts, 429)
  if (new Date(record.expires_at).getTime() <= Date.now()) {
    throw new AppError(messages.auth.otpInvalidOrExpired, 400)
  }

  const matches = await bcrypt.compare(otp, record.otp_hash)
  if (!matches) {
    await PasswordResetOtp.increment("attempts", { where: { email } })
    throw new AppError(messages.auth.otpInvalid, 400)
  }

  await PasswordResetOtp.update({ verified: true }, { where: { email } })
}

async function resetPassword({ email, otp, newPassword }) {
  await verifyPasswordResetOtp({ email, otp })
  const user = await User.findOne({ where: { email } })
  if (!user) throw new AppError(messages.common.userNotFound, 404)

  const record = await PasswordResetOtp.findByPk(email)
  if (!record?.verified) throw new AppError(messages.auth.otpVerificationRequired, 400)

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS)
  await user.update({ password_hash: passwordHash })
  await PasswordResetOtp.destroy({ where: { email } })
  return toPublicUser(user)
}

function toPublicUser(user) {
  const { id, name, email, created_at, updated_at, role, email_verified } = user
  return { id, name, email, created_at, updated_at, role, email_verified }
}

module.exports = {
  register,
  login,
  verifyEmail,
  changePassword,
  sendPasswordResetOtp,
  verifyPasswordResetOtp,
  resetPassword,
  createAccessToken,
  getJwtSecret,
}
