const userService = require("../services/user.service")
const messages = require("../utils/messages")

async function getProfile(req, res, next) {
  try {
    res.json({ data: await userService.getProfile(req.user.id) })
  } catch (error) {
    next(error)
  }
}

async function updateProfile(req, res, next) {
  try {
    const user = await userService.updateProfile({
      userId: req.user.id,
      ...req.body,
    })
    res.json({ message: messages.user.profileUpdated, data: user })
  } catch (error) {
    next(error)
  }
}

async function deleteAccount(req, res, next) {
  try {
    await userService.deleteAccount(req.user.id)
    res.json({ message: messages.user.accountDeleted })
  } catch (error) {
    next(error)
  }
}

module.exports = { getProfile, updateProfile, deleteAccount }
