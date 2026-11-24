const authService = require("../services/auth.service")
const AppError = require("../utils/app-error")
const messages = require("../utils/messages")

const verificationLinkNotFoundPage = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Verification link not found</title>
  </head>
  <body style="font-family:Arial,sans-serif;max-width:600px;margin:80px auto;padding:24px;color:#1f2937;">
    <h1>Verification link not found</h1>
    <p>This link may have expired or already been used. You can close this page.</p>
  </body>
</html>`

async function register(req, res, next) {
  try {
    const result = await authService.register(req.body)
    res.status(201).json({
      message: messages.auth.registrationComplete,
      data: result.user,
    })
  } catch (error) {
    next(error)
  }
}

async function verifyEmail(req, res, next) {
  try {
    const user = await authService.verifyEmail(req.params.token)
    res.json({
      message: messages.auth.emailVerified,
      data: user,
    })
  } catch (error) {
    if (
      error instanceof AppError &&
      error.message === messages.auth.emailVerificationInvalidOrExpired
    ) {
      return res
        .status(404)
        .type("html")
        .set("Cache-Control", "no-store")
        .send(verificationLinkNotFoundPage)
    }
    next(error)
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body)
    res.json({
      message: messages.auth.loginSuccessful,
      data: result.user,
      accessToken: result.accessToken,
    })
  } catch (error) {
    next(error)
  }
}

async function changePassword(req, res, next) {
  try {
    await authService.changePassword({
      userId: req.user.id,
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword,
    })
    res.json({ message: messages.auth.passwordChanged })
  } catch (error) {
    next(error)
  }
}

async function sendOtp(req, res, next) {
  try {
    await authService.sendPasswordResetOtp(req.body.email)
    res.json({ message: messages.auth.otpSent })
  } catch (error) {
    next(error)
  }
}

async function verifyOtp(req, res, next) {
  try {
    await authService.verifyPasswordResetOtp(req.body)
    res.json({ message: messages.auth.otpVerified })
  } catch (error) {
    next(error)
  }
}

async function resetPassword(req, res, next) {
  try {
    await authService.resetPassword(req.body)
    res.json({ message: messages.auth.passwordReset })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  register,
  verifyEmail,
  login,
  changePassword,
  sendOtp,
  verifyOtp,
  resetPassword,
}
