const mongoose = require('mongoose')
const passportLocalStrategy = require('passport-local-mongoose')

const resetSchema = mongoose.Schema({
    username: String,
    resetPasswordToken: String,
    resetPasswordExpires: Number
})

resetSchema.plugin(passportLocalStrategy)
module.exports = mongoose.model('Reset', resetSchema)