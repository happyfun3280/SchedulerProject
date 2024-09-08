const mongoose = require("mongoose");

const pushSchema = new mongoose.Schema({
    title: { type: String, required: true },
    body: { type: String, required: true },
    push_id: { type: String, required: true }
})

module.exports = mongoose.model('pushes', pushSchema);