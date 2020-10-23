const mongoose = require("mongoose");
// const passportLocalStrategy = require('passport-local-mongoose')

const favoriteSchema = new mongoose.Schema({
  receipe: String,
  title: String,
  // name: String,
  image: String,
  desc: String,
  user: String,
  date: {
    type: Date,
    default: Date.now(),
  },
});
// receipeSchema.plugin(passportLocalStrategy)

module.exports = mongoose.model("Favorite", favoriteSchema);
