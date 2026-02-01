const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', required: true },
    content: { type: String, required: true },
    likesCount: { type: Number, default: 0 },
    repliesCount: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 },
    // Trending score - calculated from engagement
    trendingScore: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

// Index for trending queries
PostSchema.index({ trendingScore: -1, createdAt: -1 });

module.exports = mongoose.model('Post', PostSchema);
