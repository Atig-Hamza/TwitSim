const mongoose = require('mongoose');

const MemorySchema = new mongoose.Schema({
    agent: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', required: true },
    content: { type: String, required: true }, // Summary of what happened
    type: { type: String, enum: ['action', 'observation', 'reflection'], required: true },
    relatedId: { type: mongoose.Schema.Types.ObjectId }, // ID of related post/interaction
    relevance: { type: Number, default: 1.0 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Memory', MemorySchema);
