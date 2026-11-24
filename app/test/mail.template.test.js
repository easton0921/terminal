const test = require("node:test")
const assert = require("node:assert/strict")
const smtp = require("../emails/smtp")
const { sendRegistrationEmail } = require("../emails/onboarding")

test("registration email builds dynamic HTML and escapes user-provided names", async () => {
  const originalSendEmail = smtp.sendEmail
  const originalAppUrl = process.env.APP_URL
  let sentMessage
  smtp.sendEmail = async (message) => {
    sentMessage = message
  }
  process.env.APP_URL = "https://example.com"

  try {
    await sendRegistrationEmail({
      email: "ada@example.com",
      fullName: "<Ada & Bob>",
      verificationToken: "a".repeat(64),
    })

    assert.match(sentMessage.html, /Hello, &lt;Ada &amp; Bob&gt;!/)
    assert.match(
      sentMessage.html,
      /href="https:\/\/example\.com\/api\/auth\/verify-email\/a{64}"/,
    )
    assert.equal(sentMessage.to, "ada@example.com")
  } finally {
    smtp.sendEmail = originalSendEmail
    if (originalAppUrl === undefined) {
      delete process.env.APP_URL
    } else {
      process.env.APP_URL = originalAppUrl
    }
  }
})
