require("dotenv").config()

const express = require("express")
const cors = require("cors")
const morgan = require("morgan")
const path = require("path")
const apiRoutes = require("./app/routes")
const sequelize = require("./app/config/database")
const authService = require("./app/services/auth.service")
const messages = require("./app/utils/messages")
const seedAdmin = require("./app/seed/admin.seed")

// Schema synchronization stays out of normal server startup.
const app = express()

const configuredCorsOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean)
const corsOrigin = configuredCorsOrigins.length
  ? configuredCorsOrigins
  : ["development", "test"].includes(process.env.NODE_ENV)

app.use(cors({ origin: corsOrigin }))
app.use(
  morgan("combined", {
    skip: (req) => req.originalUrl.startsWith("/api/auth/verify-email/"),
  }),
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, "app", "public")))

app.use("/api", apiRoutes)

app.use((req, res) => {
  res.status(404).json({ error: messages.common.routeNotFound })
})

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error)
  }

  const status = Number(error.status) || 500
  if (status >= 500) {
    console.error(error)
  }

  res.status(status).json({
    error: status >= 500 ? messages.common.internalServerError : error.message,
  })
})

if (require.main === module) {
  async function startServer() {
    try {
      authService.getJwtSecret()
      await sequelize.authenticate()
      if (process.env.DATABASE_SYNC_ALTER === "true") {
        await sequelize.sync({ alter: true })
      }
      await seedAdmin()
    } catch (error) {
      console.error("Application startup failed:", error)
      process.exitCode = 1
      return
    }

    console.log("Database connected successfully.")

    const port = Number(process.env.PORT) || 3000
    app.listen(port, () => {
      console.log(`Server listening on port ${port}`)
    })
  }

  startServer()
}

module.exports = app
