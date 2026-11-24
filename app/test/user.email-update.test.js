const test = require("node:test")
const assert = require("node:assert/strict")
const User = require("../models/user.model")
const smtp = require("../emails/smtp")
const userService = require("../services/user.service")

test("changing a profile email requires verification of the new address", async () => {
  const originalFindByPk = User.findByPk
  const originalSendEmail = smtp.sendEmail
  const originalAppUrl = process.env.APP_URL
  const user = {
    id: 42,
    name: "Ada Lovelace",
    email: "old@example.com",
    email_verified: true,
    async update(values) {
      Object.assign(this, values)
      return this
    },
  }
  let sentMessage
  User.findByPk = async () => user
  smtp.sendEmail = async (message) => {
    sentMessage = message
  }
  process.env.APP_URL = "http://localhost:6043"

  try {
    const updatedUser = await userService.updateProfile({
      userId: user.id,
      email: "new@example.com",
    })

    assert.equal(updatedUser.email_verified, false)
    assert.equal(user.email_verification_token_hash.length, 64)
    assert.ok(user.email_verification_expires_at > new Date())
    assert.equal(sentMessage.to, "new@example.com")
  } finally {
    User.findByPk = originalFindByPk
    smtp.sendEmail = originalSendEmail
    if (originalAppUrl === undefined) {
      delete process.env.APP_URL
    } else {
      process.env.APP_URL = originalAppUrl
    }
  }
})
