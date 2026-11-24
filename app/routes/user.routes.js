const express = require("express")
const userController = require("../controllers/user.controller")
const authenticate = require("../middleware/authenticate")
const validate = require("../middleware/validate")
const { updateProfileSchema } = require("../validators/user.validation")

const router = express.Router()

router.use(authenticate)
router.get("/profile", userController.getProfile)
router.patch("/profile", validate(updateProfileSchema), userController.updateProfile)
router.delete("/profile", userController.deleteAccount)

module.exports = router
