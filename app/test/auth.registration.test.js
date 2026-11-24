const test = require("node:test")
const assert = require("node:assert/strict")
require("dotenv").config()
const User = require("../models/user.model")
const authService = require("../services/auth.service")
const smtp = require("../emails/smtp")

test("registration invokes the email verification sender for the created user", async () => {
  const originalCreate = User.create
  const originalSendEmail = smtp.sendEmail
  let sentEmail
  User.create = async (attributes) => ({
    id: 101,
    role: "user",
    created_at: new Date(),
    updated_at: new Date(),
    ...attributes,
    async update(values) {
      Object.assign(this, values)
      return this
    },
  })
  smtp.sendEmail = async (message) => {
    sentEmail = message
  }

  try {
    const result = await authService.register({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "correct-horse",
    })

    assert.equal(sentEmail.to, "ada@example.com")
    assert.equal(result.user.email_verified, false)
  } finally {
    User.create = originalCreate
    smtp.sendEmail = originalSendEmail
  }
})
