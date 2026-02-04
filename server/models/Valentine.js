const mongoose = require('mongoose');

const valentineSchema = new mongoose.Schema({
    valentineId: {
        type: String,
        required: true,
        unique: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    orderId: String,
    theme: {
        type: String,
        required: true
    },
    config: {
        type: Object,
        default: {}
    },
    features: [String],
    views: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Valentine', valentineSchema);
