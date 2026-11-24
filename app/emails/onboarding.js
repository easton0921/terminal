const smtp = require("./smtp")

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }
    return entities[character]
  })
}

async function sendRegistrationEmail(options) {
  const { email, fullName, verificationToken } = options
  const appUrl = (process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`)
    .replace(/\/+$/, "")
  const verificationUrl = `${appUrl}/api/auth/verify-email/${verificationToken}`
  const safeName = escapeHtml(fullName)
  const safeVerificationUrl = escapeHtml(verificationUrl)
  const emailContent = `<!doctype html>
<html lang="en">
  <head>
    <title>Welcome</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="font-family:Arial,sans-serif;background-color:#f3f4f6;padding:24px;color:#1f2937;">
    <div style="max-width:600px;margin:2rem auto;background-color:#ffffff;border-radius:8px;padding:32px;">
      <h1 style="text-align:center;font-size:25px;color:#323e81;">Hello, ${safeName}!</h1>
      <p style="font-size:16px;line-height:1.6;text-align:center;">
        Verify your email address to activate your account.
      </p>
      <div style="text-align:center;margin:30px 0;">
        <a href="${safeVerificationUrl}" style="background-color:#323e81;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">
          Verify email address
        </a>
      </div>
      <p style="font-size:14px;color:#666;text-align:center;line-height:1.6;">
        This link expires in 24 hours and can only be used once.
      </p>
      <p style="font-size:13px;color:#666;text-align:center;line-height:1.6;word-break:break-all;">
        If the button does not work, copy this link into your browser:<br>
        <a href="${safeVerificationUrl}" style="color:#2563eb;">${safeVerificationUrl}</a>
      </p>
      <p style="border-top:1px solid #dddddd;padding-top:20px;margin-top:32px;text-align:center;font-size:12px;color:#666;">
        This is an automated email. Please do not reply.<br>
        &copy; ${new Date().getFullYear()} Terminal. All rights reserved.
      </p>
    </div>
  </body>
</html>`

  await smtp.sendEmail({
    to: email,
    subject: "Welcome — verify your email address",
    text: `Hi ${fullName},\n\nVerify your email address by opening this link: ${verificationUrl}\nThis link expires in 24 hours and can only be used once.`,
    html: emailContent,
  })
}

module.exports = { sendRegistrationEmail }
