const mongoose = require('mongoose');

const FollowSchema = new mongoose.Schema({
    follower: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', required: true },
    following: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', required: true },
    createdAt: { type: Date, default: Date.now }
});

// Prevent duplicate follows
FollowSchema.index({ follower: 1, following: 1 }, { unique: true });

module.exports = mongoose.model('Follow', FollowSchema);
