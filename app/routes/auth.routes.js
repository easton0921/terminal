const express = require("express")
const authController = require("../controllers/auth.controller")
const authenticate = require("../middleware/authenticate")
const validate = require("../middleware/validate")
const schemas = require("../validators/auth.validation")

const router = express.Router()

router.post("/register", validate(schemas.registerSchema), authController.register)
router.get(
  "/verify-email/:token",
  validate(schemas.verifyEmailSchema, "params"),
  authController.verifyEmail,
)
router.post("/login", validate(schemas.loginSchema), authController.login)
router.post("/change-password", authenticate, validate(schemas.changePasswordSchema), authController.changePassword)
router.post("/send-otp", validate(schemas.sendOtpSchema), authController.sendOtp)
router.post("/verify-otp", validate(schemas.verifyOtpSchema), authController.verifyOtp)
router.post("/reset-password", validate(schemas.resetPasswordSchema), authController.resetPassword)

module.exports = router
