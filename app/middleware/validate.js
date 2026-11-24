const messages = require("../utils/messages")

function validate(schema, source = "body") {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      convert: true,
    })

    if (error) {
      return res.status(400).json({
        error: messages.validation.failed,
        details: error.details.map(({ message, path }) => ({
          field: path.join(".") || "body",
          message,
        })),
      })
    }

    req[source] = value
    next()
  }
}

module.exports = validate
