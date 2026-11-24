const nodemailer = require("nodemailer")

let transport

function getTransport() {
  if (!process.env.SMTP_HOST) return null
  if (transport) return transport

  transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  })

  return transport
}

async function sendEmail({ to, subject, text, html }) {
  const smtpTransport = getTransport()

  if (!smtpTransport) {
    if (["development", "test"].includes(process.env.NODE_ENV)) {
      console.log(`Email to ${to}:\n${text}`)
      return
    }
    throw new Error("SMTP_HOST must be configured to send emails outside development")
  }

  await smtpTransport.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  })
  console.log(`Email sent successfully to ${to}`)
}

module.exports = { sendEmail }
