const jwt = require("jsonwebtoken")
const authService = require("../services/auth.service")
const messages = require("../utils/messages")
const ROLES = require("../utils/roles")

function authenticate(req, res, next) {
  const authorization = req.get("authorization")
  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({ error: messages.authentication.required })
  }

  try {
    const token = authorization.slice(7)
    const payload = jwt.verify(token, authService.getJwtSecret())
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role || ROLES.USER,
    }
    next()
  } catch (error) {
    return res.status(401).json({ error: messages.authentication.invalidToken })
  }
}

module.exports = authenticate
