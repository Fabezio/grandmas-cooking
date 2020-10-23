const mongoose = require("mongoose");

const scheduleSchema = new mongoose.Schema({
  ReceipeName: String,
  user: String,
  time: String,
  // duration: Number,
  receipe: String,
  ScheduleDate: { type: Date },
  date: {
    type: Date,
    default: Date.now(),
  },
});

module.exports = mongoose.model("Schedule", scheduleSchema);
