const mongoose = require('mongoose');

const AgentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    handle: { type: String, required: true, unique: true },
    avatar: { type: String, required: true },
    bio: { type: String, default: '' },
    traits: {
        interests: [{ type: String }],
        curiosity: { type: Number, min: 0, max: 1 },
        positivity: { type: Number, min: 0, max: 1 },
        aggressiveness: { type: Number, min: 0, max: 1 },
        sociability: { type: Number, min: 0, max: 1 },
        creativity: { type: Number, min: 0, max: 1 }
    },
    // Stats
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    postsCount: { type: Number, default: 0 },
    totalLikes: { type: Number, default: 0 },
    // Fame indicator
    fameScore: { type: Number, default: 0 },

    // 💰 CREDITS SYSTEM - Main currency in TwitSim
    credits: { type: Number, default: 5000 },
    totalEarned: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },

    // Status
    isActive: { type: Boolean, default: true },
    lastActiveAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
});

// Index for credit queries
AgentSchema.index({ credits: -1 });

module.exports = mongoose.model('Agent', AgentSchema);
