const bcrypt = require("bcrypt")
const { UniqueConstraintError } = require("sequelize")
const User = require("../models/user.model")
const ROLES = require("../utils/roles")

const BCRYPT_ROUNDS = 12

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD
  const name = process.env.ADMIN_NAME?.trim() || "Administrator"

  if (!email && !password) {
    console.warn("Admin seed skipped: configure ADMIN_EMAIL and ADMIN_PASSWORD to create the admin account.")
    return
  }
  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be configured")
  }
  if (password.length < 12) {
    throw new Error("ADMIN_PASSWORD must be at least 12 characters")
  }
  if (Buffer.byteLength(password, "utf8") > 72) {
    throw new Error("ADMIN_PASSWORD must be at most 72 UTF-8 bytes")
  }

  let user = await User.findOne({ where: { email } })
  if (!user) {
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)
    try {
      const [createdUser] = await User.findOrCreate({
        where: { email },
        defaults: {
          name,
          email,
          password_hash: passwordHash,
          role: ROLES.ADMIN,
          email_verified: true,
        },
      })
      user = createdUser
    } catch (error) {
      if (!(error instanceof UniqueConstraintError) && error.original?.code !== "23505") {
        throw error
      }
      user = await User.findOne({ where: { email } })
      if (!user) throw error
    }
  }

  const updates = {}
  if (user.role !== ROLES.ADMIN) updates.role = ROLES.ADMIN
  if (!user.email_verified) updates.email_verified = true
  if (!(await bcrypt.compare(password, user.password_hash))) {
    updates.password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS)
  }
  if (Object.keys(updates).length > 0) {
    await user.update(updates)
  }
}

module.exports = seedAdmin
