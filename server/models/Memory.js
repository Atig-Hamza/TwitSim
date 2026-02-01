const mongoose = require('mongoose');

// Agent memory - stores what they remember about interactions
const MemorySchema = new mongoose.Schema({
    agent: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', required: true },
    // Type of memory
    type: {
        type: String,
        enum: ['interaction', 'opinion', 'relationship', 'topic', 'experience'],
        required: true
    },
    // What they remember
    content: { type: String, required: true },
    // Related entities
    relatedAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent' },
    relatedPost: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    // Sentiment (-1 to 1)
    sentiment: { type: Number, default: 0 },
    // Importance (0 to 1) - higher = remembered longer
    importance: { type: Number, default: 0.5 },
    // Emotional tags
    emotions: [{ type: String }],
    createdAt: { type: Date, default: Date.now },
    // Memories decay over time - last accessed
    lastAccessed: { type: Date, default: Date.now }
});

// Index for efficient memory queries
MemorySchema.index({ agent: 1, type: 1, createdAt: -1 });
MemorySchema.index({ agent: 1, relatedAgent: 1 });
MemorySchema.index({ agent: 1, importance: -1 });

module.exports = mongoose.model('Memory', MemorySchema);
