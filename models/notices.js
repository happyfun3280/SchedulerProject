const mongoose = require("mongoose");

const noticeSchema = new mongoose.Schema({
    notice_list: [{
        order: { type: Number, required: true },
        title: { type: String, required: true },
        body: { type: String },
        urls: [{
            title: { type: String },
            url: { type: String, required: true }
        }],
        create_member: { type: String, required: true },
        create_date: { type: String, required: true, default: new Date() }
    }]
})

module.exports = mongoose.model('notices', noticeSchema);