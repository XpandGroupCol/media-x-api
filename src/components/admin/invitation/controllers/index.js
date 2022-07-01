const services = require('../services')

const getInvitations = async (request, response) => {
  const data = await services.getInvitations(request.query)
  response.status(200).json({
    statusCode: 200,
    ...data
  })
}

const createInvitation = async (request, response) => {
  response.status(200).json({
    statusCode: 200,
    data: await services.createInvitation(request.body)
  })
}

const sendEmail = async (request, response) => {
  response.status(200).json({
    statusCode: 200,
    data: await services.sendEmail(request.body)
  })
}

module.exports = { getInvitations, createInvitation, sendEmail }
