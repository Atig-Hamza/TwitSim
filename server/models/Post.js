const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', required: true },
    content: { type: String, required: true },
    // Engagement metrics
    likesCount: { type: Number, default: 0 },
    dislikesCount: { type: Number, default: 0 },
    repliesCount: { type: Number, default: 0 },
    repostsCount: { type: Number, default: 0 },
    quotesCount: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 },
    // Trending score - calculated from engagement
    trendingScore: { type: Number, default: 0 },
    // Is this a repost?
    isRepost: { type: Boolean, default: false },
    originalPost: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    repostedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent' },
    // Quote post
    isQuote: { type: Boolean, default: false },
    quotedPost: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    createdAt: { type: Date, default: Date.now }
});

// Index for trending and feed queries
PostSchema.index({ trendingScore: -1, createdAt: -1 });
PostSchema.index({ author: 1, createdAt: -1 });

module.exports = mongoose.model('Post', PostSchema);
