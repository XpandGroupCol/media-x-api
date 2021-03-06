require('../../../../models/Location')
require('../../../../models/Payment')
const Campaign = require('../../../../models/Campaign')
const Publisher = require('../../../../models/Publisher')
const User = require('../../../../models/User')
const { rgx } = require('../../../../utils')
const { uploadS3File } = require('../../../../utils/aws-upload')
const { checkFormatFile } = require('../../../../utils/formatFile')
const { hookUploadFile } = require('../../../v1/campaigns/hooks')

const PER_PAGE = 9

const leanById = ({ ages, sex, sector, target, __v, _id, ...restOfCampaign }) => ({
  _id: _id,
  ages: ages.map(({ _id, name }) => ({ value: _id, label: name })),
  sector: { value: sector?._id, label: sector?.name },
  target: { value: target?._id, label: target?.name },
  sex,
  ...restOfCampaign
})

const getCampaigns = async ({ user, search, page = 1, status }) => {
  const currentPage = page < 1 ? 0 : page - 1

  let query = { user, isDelete: false }

  if (search) {
    query = {
      ...query,
      $or: [
        { brand: { $regex: rgx(search), $options: 'i' } },
        { name: { $regex: rgx(search), $options: 'i' } }
      ]
    }
  }

  if (status) {
    query = { ...query, status }
  }

  const data = await Campaign.find(query)
    .populate('user')
    .populate('sector')
    .populate('target')
    .populate('locations')
    .populate('ages')
    .populate({
      path: 'payments',
      options: { sort: '-createdAt', limit: 1 }
    })
    .limit(PER_PAGE).skip(PER_PAGE * currentPage).lean().exec()

  const total = await Campaign.countDocuments(query)

  return {
    data,
    total,
    pages: Math.ceil(total / PER_PAGE),
    page: currentPage + 1
  }
}

const getPublishersByTargetId = async ({ target = null, miniBudget = null, user: userId }) => {
  const conditions = []
  const data = []
  let query = {}

  if (target) {
    conditions.push({
      ...query,
      'formats.target':
      { $in: target.split(',') }
    })
  }

  if (miniBudget) {
    conditions.push({
      ...query,
      miniBudget:
        { $lte: parseInt(miniBudget) }
    })
  }

  query = {
    $and: conditions
  }

  const publishers = await Publisher.find(query)
    .populate('formats.format')
    .populate('formats.target')
    .lean()
    .exec()

  const user = await User.findById(userId)

  if (publishers.length) {
    publishers.map(publisher => {
      if (publisher.formats.length) {
        publisher.formats.filter(({ target: t }) =>
          t._id.toString() === target
        ).map(format => {
          return data.push({
            id: `${publisher._id}-${format._id}`,
            publisherId: publisher._id,
            formatId: format._id,
            logo: publisher.logo || '',
            label: format.format.name || '',
            width: format.format.width,
            height: format.format.height,
            mimetype: format.format.type || '',
            publisherCategory: publisher.category || '',
            biddingModel: format.biddingModel || '',
            device: format.device || '',
            pricePerUnit: format.pricePerUnit,
            targetCategories: format.target.category,
            groupBy: publisher.publisher || ''
          })
        })
      }
      return data
    })
  }

  return { data, user }
}

const createCampaing = async ({ body, file, user }) => {
  if (file) {
    const logo = await uploadS3File({
      fileName: file.originalname,
      mimetype: file.mimetype,
      body: file.buffer
    })
    body.logo = logo
  }

  const data = await Campaign.create({ ...body, user })

  return data
}

const deleteCampaing = async (id) => {
  const data = await Campaign.findByIdAndUpdate(id, { isDelete: true }, { new: true })

  return data
}

const getCampaignById = async (id) => {
  const data = await Campaign.findById(id)
    .populate('sector')
    .populate('target')
    .populate('locations')
    .populate('ages')
    .populate('user')
    .populate({
      path: 'payments',
      options: { sort: '-createdAt', limit: 1 }
    }).lean().exec()

  return leanById(data)
}

const validateFormatFile = async ({ files, conditions }) => {
  if (files.length) {
    for await (const file of files) {
      await checkFormatFile(file.buffer, file.mimetype, conditions)
    }
  }

  const filesUpload = []
  for await (const file of files) {
    const fileUpload = await hookUploadFile(file)
    filesUpload.push(fileUpload)
  }

  return filesUpload
}

const updateCampaign = async ({ body, id }) => {
  const data = await Campaign.findByIdAndUpdate(id, { ...body }, { new: true })

  return data
}

const uploadfile = async ({ file, isDelete }) => {
  if (isDelete) {
    // se debe eliminar
  }

  if (file) {
    const avatar = await uploadS3File({
      fileName: file.originalname,
      mimetype: file.mimetype,
      body: file.buffer
    })

    return avatar
  }
  return null
}

module.exports = {
  getCampaigns,
  getPublishersByTargetId,
  createCampaing,
  deleteCampaing,
  getCampaignById,
  validateFormatFile,
  updateCampaign,
  uploadfile
}
