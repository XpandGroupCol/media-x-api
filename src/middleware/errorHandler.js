const boom = require('@hapi/boom')

const catchErrors = (fn) => (req, res, next) =>
  fn(req, res, next).catch(next)

const withErrorStack = (err, stack) => {
  if (process.env.NODE_ENV !== 'production') {
    return { err, stack }
  }

  return err
}

const notFoundHandler = (_, res) => {
  const {
    output: { statusCode, payload }
  } = boom.notFound()

  res.status(statusCode).json(payload)
}

const logError = (err, req, res, next) => {
  const statusCode = err.isBoom ? err.output.statusCode : 500

  res.status(statusCode).json({
    statusCode,
    error: true,
    message: err?.output?.payload?.message || err?.message.trim() || 'Internal server error'
  })
}

module.exports = {
  catchErrors,
  withErrorStack,
  notFoundHandler,
  logError
}
