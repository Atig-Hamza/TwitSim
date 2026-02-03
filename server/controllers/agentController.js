const Agent = require('../models/Agent');
const Memory = require('../models/Memory');

exports.getMemories = async (req, res) => {
    try {
        const { id } = req.params;
        const memories = await Memory.find({ agent: id })
            .sort({ importance: -1, createdAt: -1 })
            .limit(10);
        res.status(200).json(memories);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.addMemory = async (req, res) => {
    try {
        const { agentId, type, content, relatedAgent, importance } = req.body;
        const memory = new Memory({
            agent: agentId,
            type,
            content,
            relatedAgent,
            importance: importance || 0.5
        });
        await memory.save();
        res.status(201).json(memory);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.register = async (req, res) => {
    try {
        const { name, handle, avatar, bio, traits, credits } = req.body;
        let agent = await Agent.findOne({ handle });
        if (!agent) {
            // 5 minutes of life for new agents
            const deathTime = new Date(Date.now() + 5 * 60 * 1000);
            agent = new Agent({ name, handle, avatar, bio, traits, credits, deathTime });
            await agent.save();
        }
        res.status(200).json(agent);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAllAgents = async (req, res) => {
    try {
        const { sort } = req.query;
        let sortOption = { createdAt: -1 }; // Default: newest first

        if (sort === 'famous') {
            sortOption = { fameScore: -1, followersCount: -1 };
        } else if (sort === 'rich') {
            sortOption = { credits: -1 };
        } else if (sort === 'poor') {
            sortOption = { credits: 1 };
        } else if (sort === 'active') {
            sortOption = { lastActiveAt: -1 };
        }

        const agents = await Agent.find()
            .sort(sortOption)
            .select('_id name handle avatar bio credits fameScore followersCount followingCount postsCount totalLikes totalEarned totalSpent isActive lastActiveAt createdAt traits deathTime businesses');

        // Migration: Ensure all agents have a deathTime
        const uninitialized = agents.filter(a => !a.deathTime);
        if (uninitialized.length > 0) {
            const fiveMinFromNow = new Date(Date.now() + 5 * 60 * 1000);
            const idsToUpdate = uninitialized.map(a => a._id);
            
            await Agent.updateMany(
                { _id: { $in: idsToUpdate } },
                { $set: { deathTime: fiveMinFromNow } }
            );

            // Update in memory for this response
            uninitialized.forEach(a => a.deathTime = fiveMinFromNow);
        }

        res.status(200).json(agents);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAgentByHandle = async (req, res) => {
    try {
        const agent = await Agent.findOne({ handle: req.params.handle });
        if (!agent) return res.status(404).json({ error: 'Agent not found' });
        res.status(200).json(agent);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get statistics about all agents
exports.getAgentStats = async (req, res) => {
    try {
        const stats = await Agent.aggregate([
            {
                $group: {
                    _id: null,
                    totalAgents: { $sum: 1 },
                    activeAgents: { $sum: { $cond: ['$isActive', 1, 0] } },
                    totalCredits: { $sum: '$credits' },
                    avgCredits: { $avg: '$credits' },
                    totalPosts: { $sum: '$postsCount' },
                    totalFollows: { $sum: '$followersCount' }
                }
            }
        ]);

        res.status(200).json(stats[0] || {});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
