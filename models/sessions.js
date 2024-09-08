const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
    expires: { type: Date },
    session: { type: String }
})

module.exports = mongoose.model('sessions', sessionSchema);