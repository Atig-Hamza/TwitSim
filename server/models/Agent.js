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
        sociability: { type: Number, min: 0, max: 1 }
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Agent', AgentSchema);
