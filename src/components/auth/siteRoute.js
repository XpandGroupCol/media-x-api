const asyncHandler = require('../../middleware/asynHandler')
const { validateRequestSchema } = require('../../middleware/requestSchemaHandler')
const siteAuthRouter = require('express').Router()

const controllers = require('./controllers')
const schemas = require('./schemas')

siteAuthRouter.post('/auth',
  validateRequestSchema(schemas.authSchema),
  asyncHandler(controllers.authSite))

siteAuthRouter.post('/auth/refresh-token',
  validateRequestSchema(schemas.tokenSchema),
  asyncHandler(controllers.refreshToken))

siteAuthRouter.post('/auth/forgot-password',
  validateRequestSchema(schemas.forgotPasswordSchema),
  asyncHandler(controllers.forgotPassword))

siteAuthRouter.post('/auth/validate-token',
  validateRequestSchema(schemas.tokenSchema),
  asyncHandler(controllers.validateToken))

siteAuthRouter.post('/auth/change-password',
  validateRequestSchema(schemas.changePasswordSchema),
  asyncHandler(controllers.changePassword))

siteAuthRouter.get('/auth/validate-invitation/:token',
  validateRequestSchema(schemas.tokenSchema, 'params'),
  asyncHandler(controllers.verifyInvitation))

siteAuthRouter.post('/auth/sign-up',
  validateRequestSchema(schemas.signupSchema),
  asyncHandler(controllers.signup))

module.exports = siteAuthRouter
