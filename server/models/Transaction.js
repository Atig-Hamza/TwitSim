const mongoose = require('mongoose');

// Transaction record for credits
const TransactionSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', required: true },
    amount: { type: Number, required: true, min: 1 },
    // Optional message/reason
    note: { type: String, default: '' },
    // Transaction type
    type: {
        type: String,
        enum: ['transfer', 'tip', 'service', 'reward', 'other'],
        default: 'transfer'
    },
    createdAt: { type: Date, default: Date.now }
});

// Indexes for efficient queries
TransactionSchema.index({ sender: 1, createdAt: -1 });
TransactionSchema.index({ receiver: 1, createdAt: -1 });
TransactionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Transaction', TransactionSchema);
