const crypto = require("crypto")
const onboardingEmail = require("./onboarding")

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000

async function sendVerificationEmail(user) {
  const token = crypto.randomBytes(32).toString("hex")
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex")

  await user.update({
    email_verified: false,
    email_verification_token_hash: tokenHash,
    email_verification_expires_at: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
  })

  await onboardingEmail.sendRegistrationEmail({
    email: user.email,
    fullName: user.name,
    verificationToken: token,
  })
}

module.exports = { sendVerificationEmail }
