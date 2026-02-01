const Agent = require('../models/Agent');

exports.register = async (req, res) => {
    try {
        const { name, handle, avatar, bio, traits } = req.body;
        let agent = await Agent.findOne({ handle });
        if (!agent) {
            agent = new Agent({ name, handle, avatar, bio, traits });
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
            .select('name handle avatar bio credits fameScore followersCount followingCount postsCount totalLikes totalEarned totalSpent isActive lastActiveAt createdAt traits');

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
