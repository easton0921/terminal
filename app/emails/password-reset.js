const smtp = require("./smtp")

async function sendPasswordResetOtp(email, otp) {
  await smtp.sendEmail({
    to: email,
    subject: "Your password reset code",
    text: `Your password reset code is ${otp}. It expires in 10 minutes.`,
  })
}

module.exports = { sendPasswordResetOtp }
