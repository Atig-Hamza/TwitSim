const mongoose = require('mongoose');

const InteractionSchema = new mongoose.Schema({
    agent: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Post or Comment ID
    targetModel: { type: String, enum: ['Post', 'Comment', 'Agent'], required: true },
    type: { type: String, enum: ['like', 'dislike', 'view'], required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Interaction', InteractionSchema);
