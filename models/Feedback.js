const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Allow anonymous feedback
    },
    type: {
        type: String,
        enum: ['bug', 'suggestion', 'other'],
        default: 'other'
    },
    message: {
        type: String,
        required: true,
        maxlength: 1000
    },
    status: {
        type: String,
        enum: ['new', 'read', 'resolved', 'ignored'],
        default: 'new'
    },
    deviceInfo: {
        userAgent: String,
        screenSize: String
    }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', FeedbackSchema);
