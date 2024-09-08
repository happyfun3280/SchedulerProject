const mongoose = require("mongoose");

const scheduleSchema = new mongoose.Schema({
    schedule_list: [{
        order: { type: Number, required: true },
        title: { type: String, required: true },
        create_member: { type: String, required: true },
        schedule_date: { type: Date, required: true },
        create_date: { type: Date, required: true, default: Date() }
    }]
})

module.exports = mongoose.model('schedules', scheduleSchema);