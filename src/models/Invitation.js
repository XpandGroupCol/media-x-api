const { Schema, model } = require('mongoose')

const InvitationSchema = new Schema({
  name: {
    type: String,
    required: true,
    lowercase: true
  },
  lastName: {
    type: String,
    required: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  activeCampaignId: {
    type: Number
  },
  sendEmail: {
    type: Boolean,
    default: false
  },
  hasUser: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

const Invitation = model('Invitation', InvitationSchema)

module.exports = Invitation
