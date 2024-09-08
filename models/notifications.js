const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    class_id: { type: String, required: true },
    schedule_id: { type: String, required: true },
    reserve_date: { type: Date, required: true }
})

module.exports = mongoose.model('notifications', notificationSchema);