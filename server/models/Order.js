const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true,
        unique: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Allow guest checkout
    },
    amount: {
        type: Number,
        required: true
    },
    theme: String,
    features: [String],
    status: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending'
    },
    transactionId: String,
    valentineId: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    paidAt: Date
});

module.exports = mongoose.model('Order', orderSchema);
