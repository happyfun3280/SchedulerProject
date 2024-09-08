const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    google_id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    push_token: [{
        static_token: { type: String, required: true },
        dynamic_token: { type: String, required: true },
        permission: { type: Boolean, required: true }
    }],
    class_list: [ String ],
    join_date: { type: Date, required: true, default: Date.now() }
})

module.exports = mongoose.model('users', userSchema);