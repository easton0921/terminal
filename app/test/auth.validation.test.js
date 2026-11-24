const test = require("node:test")
const assert = require("node:assert/strict")
const app = require("../../app")
const User = require("../models/user.model")
const authService = require("../services/auth.service")
const AppError = require("../utils/app-error")
const messages = require("../utils/messages")
const ROLES = require("../utils/roles")
const { registerSchema, verifyEmailSchema } = require("../validators/auth.validation")

test("new accounts default to the USER role", () => {
  const user = User.build({
    name: "Ada Lovelace",
    email: "ada@example.com",
    password_hash: "hash",
  })

  assert.equal(user.role, ROLES.USER)
  assert.equal(user.email_verified, false)
})

test("the user model rejects roles not defined in the role constants", async () => {
  const user = User.build({
    name: "Ada Lovelace",
    email: "ada@example.com",
    password_hash: "hash",
    role: "superuser",
  })

  await assert.rejects(user.validate(), { name: "SequelizeValidationError" })
})

test("valid registration data is normalized", () => {
  const { error, value } = registerSchema.validate({
    name: " Ada Lovelace ",
    email: " ADA@example.com ",
    password: "correct-horse",
  })

  assert.equal(error, undefined)
  assert.equal(value.name, "Ada Lovelace")
  assert.equal(value.email, "ada@example.com")
})

test("registration requires valid fields and rejects unknown fields", () => {
  const { error } = registerSchema.validate(
    {
      name: "A",
      email: "not-an-email",
      password: "short",
      admin: true,
    },
    { abortEarly: false },
  )

  assert.ok(error)
  assert.ok(error.details.length >= 4)
})

test("the registration route rejects invalid input before database access", async () => {
  const server = app.listen(0)
  await new Promise((resolve, reject) => {
    server.once("listening", resolve)
    server.once("error", reject)
  })

  try {
    const response = await fetch(
      `http://127.0.0.1:${server.address().port}/api/auth/register`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "A" }),
      },
    )
    const body = await response.json()

    assert.equal(response.status, 400)
    assert.equal(body.error, "Validation failed")
    assert.ok(Array.isArray(body.details))
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()))
    })
  }
})

test("the email verification route rejects malformed tokens before database access", async () => {
  const server = app.listen(0)
  await new Promise((resolve, reject) => {
    server.once("listening", resolve)
    server.once("error", reject)
  })

  try {
    const response = await fetch(
      `http://127.0.0.1:${server.address().port}/api/auth/verify-email/invalid`,
    )
    const body = await response.json()

    assert.equal(response.status, 400)
    assert.equal(body.error, "Validation failed")
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()))
    })
  }
})

test("used verification links return an HTML 404 page", async () => {
  const originalVerifyEmail = authService.verifyEmail
  const server = app.listen(0)
  authService.verifyEmail = async () => {
    throw new AppError(messages.auth.emailVerificationInvalidOrExpired, 400)
  }
  await new Promise((resolve, reject) => {
    server.once("listening", resolve)
    server.once("error", reject)
  })

  try {
    const response = await fetch(
      `http://127.0.0.1:${server.address().port}/api/auth/verify-email/${"a".repeat(64)}`,
    )
    const body = await response.text()

    assert.equal(response.status, 404)
    assert.match(response.headers.get("content-type"), /text\/html/)
    assert.match(body, /Verification link not found/)
  } finally {
    authService.verifyEmail = originalVerifyEmail
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()))
    })
  }
})

test("JWT secrets shorter than 32 bytes are rejected", () => {
  const originalSecret = process.env.JWT_SECRET

  try {
    process.env.JWT_SECRET = "x".repeat(31)
    assert.throws(() => authService.getJwtSecret(), {
      message: messages.auth.jwtSecretTooShort,
    })

    process.env.JWT_SECRET = "x".repeat(32)
    assert.equal(authService.getJwtSecret(), process.env.JWT_SECRET)
  } finally {
    if (originalSecret === undefined) {
      delete process.env.JWT_SECRET
    } else {
      process.env.JWT_SECRET = originalSecret
    }
  }
})

test("registration passwords exceeding bcrypt's UTF-8 byte limit are rejected", () => {
  const { error } = registerSchema.validate({
    name: "Ada Lovelace",
    email: "ada@example.com",
    password: "😀".repeat(19),
  })

  assert.ok(error)
})

test("public registration does not allow a client to select a role", () => {
  const { error } = registerSchema.validate({
    name: "Ada Lovelace",
    email: "ada@example.com",
    password: "correct-horse",
    role: "admin",
  })

  assert.ok(error)
  assert.ok(error.details.some(({ path }) => path[0] === "role"))
})

test("email verification links require a 64-character hexadecimal token", () => {
  assert.equal(
    verifyEmailSchema.validate({ token: "a".repeat(64) }).error,
    undefined,
  )
  assert.ok(verifyEmailSchema.validate({ token: "not-a-token" }).error)
})
