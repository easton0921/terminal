module.exports = Object.freeze({
  auth: Object.freeze({
    registrationComplete: "Registration successful. Check your email to verify your account.",
    loginSuccessful: "Login successful",
    emailVerified: "Email verified successfully",
    emailNotVerified: "Please verify your email before logging in",
    emailVerificationInvalidOrExpired: "Email verification link is invalid, expired, or already used",
    passwordChanged: "Password changed successfully",
    otpSent: "If the account exists, an OTP has been sent",
    otpVerified: "OTP verified successfully",
    passwordReset: "Password reset successfully",
    jwtSecretNotConfigured: "JWT_SECRET is not configured",
    jwtSecretTooShort: "JWT_SECRET must be at least 32 bytes",
    invalidCredentials: "Invalid email or password",
    currentPasswordIncorrect: "Current password is incorrect",
    otpInvalidOrExpired: "OTP is invalid or expired",
    tooManyOtpAttempts: "Too many OTP attempts",
    otpInvalid: "OTP is invalid",
    otpVerificationRequired: "OTP verification required",
  }),
  user: Object.freeze({
    profileUpdated: "Profile updated",
    accountDeleted: "Account deleted successfully",
  }),
  validation: Object.freeze({
    failed: "Validation failed",
  }),
  authentication: Object.freeze({
    required: "Authentication required",
    invalidToken: "Invalid or expired token",
  }),
  common: Object.freeze({
    emailAlreadyRegistered: "Email is already registered",
    userNotFound: "User not found",
    routeNotFound: "Route not found",
    internalServerError: "Internal server error",
  }),
})
