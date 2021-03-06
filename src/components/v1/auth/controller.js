
const boom = require('@hapi/boom')
const bcryptjs = require('bcryptjs')
const { ROLES } = require('../../../config')
const User = require('../../../models/User')
const { sendEmail } = require('../../../utils/aws/SES')
const { getUserAuth } = require('../../../utils/transformData')

const jwt = require('jsonwebtoken')

const adminLogin = async (request, response) => {
  const { email, password } = request.body
  const user = await User.findOne({
    email,
    status: true,
    role: { $ne: ROLES[1].id }
  })

  if (!user ||
      !bcryptjs.compareSync(password, user.password)) {
    throw boom.unauthorized('El correo electrónico o contraseña son incorrectos.')
  }

  if (user && !user?.emailVerified) {
    throw boom.unauthorized('Su cuenta no ha sido verificada.')
  }

  response.status(200).json({
    statusCode: 200,
    data: getUserAuth(user)
  })
}

const login = async (request, response) => {
  const { email, password } = request.body

  const user = await User.findOne({
    email,
    statusCode: true,
    role: ROLES[1].id
  })

  if (!user ||
              !bcryptjs.compareSync(password, user.password)) {
    throw boom.unauthorized('El correo electrónico o contraseña son incorrectos.')
  }

  if (user && !user?.emailVerified) {
    throw boom.unauthorized('Su cuenta no ha sido verificada.')
  }

  response.status(200).json({
    statusCode: 200,
    data: getUserAuth(user)

  })
}

const socialAuth = async (request, response) => {
  let user = null
  const { name, lastName, provider, password = '@', email, image } = request.body

  user = await User.findOne({ email })

  if (user && user?.provider !== provider) {
    throw boom.unauthorized('Ya tiene un usuario con otro proveedor de autenticacion')
  }

  if (user && (user?.role !== ROLES[1].id || !user?.status)) {
    throw boom.unauthorized(`No pudimos acceder con su cuenta de ${provider}.Si necesitas que te rescatemos, escribemos a support@mediax.com`)
  }

  if (!user) {
    user = await User.create({ name, lastName, provider, password, email, image, role: ROLES[1]?.id, emailVerified: true })
  }

  response.status(200).json({
    statusCode: 200,
    data: getUserAuth(user)
  })
}

const verifyEmail = async (request, response) => {
  const { token } = request.body

  const { email } = jwt.verify(token, process.env.ACCESS_TOKEN)

  const user = await User.findOneAndUpdate({ email }, { emailVerified: true })

  if (!user || user.emailVerified) {
    throw boom.badRequest('El enlace de verificación no es valido.')
  }

  response.status(200).json({
    statusCode: 200, data: getUserAuth(user)
  })
}

const forgot = async (request, response) => {
  const { email } = request.body

  const user = await User.findOne({ email })

  if (!user) throw boom.badRequest('No se encontrado el usuario')

  if (user) {
    const data = { id: user?._id, email: user?.email }

    const token = jwt.sign(data, process.env.ACCESS_TOKEN)

    try {
      const sendEmailPayload = {
        destinationEmails: [user.email],
        emailSubject: 'Recuperar contraseña',
        text: 'Recuperar contraseña',
        htmlMessage: `<a href="${process.env.BASE_URL}/auth/forgot-password/${token}">Cambiar contraseña</a>`
      }
      await sendEmail(sendEmailPayload)
      response.status(200).json({ statusCode: 200, data: true })
    } catch (e) {
      throw boom.internal('Algo salio mal, por favor intenta nuevamente.')
    }
  }
}

const verifyPassword = async (request, response) => {
  const { token } = request.body

  const { email } = jwt.verify(token, process.env.ACCESS_TOKEN)

  const user = await User.findOne({ email })

  if (!user) {
    throw boom.badRequest('El enlace de verificación no es valido.')
  }

  response.status(200).json({ statusCode: 200, data: true })
}

const signup = async (request, response) => {
  let user = null
  const { name, lastName, password, email } = request.body

  user = await User.findOne({ email })

  if (user) {
    throw boom.badRequest('ya hay un usuario registrado con esos datos.')
  }

  const hashPassword = await bcryptjs.hash(password, 10)

  user = await User.create({ name, lastName, password: hashPassword, email, emailVerified: false, role: ROLES[1].id })

  const data = {
    id: user?._id,
    email: user?.email
  }

  const token = jwt.sign(data, process.env.ACCESS_TOKEN)

  try {
    // TODO:  Change sendMail by SendEmail
    // await sendMail(verifyEmal(token))
    response.status(200).json({ statusCode: 200, data: true })
  } catch (e) {
    await User.deleteOne({ email })
    throw boom.badRequest('Algo salio mal, por favor intenta nuevamente.')
  }
}

const changePassword = async (request, response) => {
  const { password, token } = request.body
  const { id } = jwt.verify(token, process.env.ACCESS_TOKEN)
  const newPassword = await bcryptjs.hash(password, 10)

  const data = await User.findByIdAndUpdate(id, { password: newPassword })
  response.status(200).json({ statusCode: 200, data })
}

module.exports = {
  adminLogin,
  login,
  socialAuth,
  verifyEmail,
  forgot,
  verifyPassword,
  signup,
  changePassword
}
