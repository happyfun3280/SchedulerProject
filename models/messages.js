const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    message_list: [{
        order: { type: Number, required: true },
        title: { type: String, required: true },
        body: { type: String },
        sender_member: { type: String, required: true },
        receiver_member: { type: String, required: true },
        receiver_block: { type: Boolean, required: true, default: false },
        create_date: { type: String, required: true, default: Date() }
    }]
})

module.exports = mongoose.model('meessages', messageSchema);