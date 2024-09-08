const mongoose = require("mongoose");

const classSchema = new mongoose.Schema({
    class_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    title: { type: String },
    invite_code: { type: String, required: true, unique: true },
    member_list: [{
        email: { type: String, required: true },
        nickname: { type: String, required: true },
        push: { type: Boolean, required: true, default: true },
        right: { type: Number, required: true }
    }],
    schedule_id: { type: String, required: true },
    schedule_count: { type: Number, required: true, default: 0 },
    notice_id: { type: String, required: true },
    notice_count: { type: Number, required: true, default: 0 },
    message_id: { type: String, required: true },
    message_count: { type: Number, required: true, default: 0 },
    create_date: { type: Date, required: true, default: Date.now() }
})

module.exports = mongoose.model('classes', classSchema);