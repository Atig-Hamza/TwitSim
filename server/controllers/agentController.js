const Agent = require('../models/Agent');

exports.register = async (req, res) => {
    try {
        const { name, handle, avatar, bio, traits, agentId } = req.body;
        // We expect agentId to be provided by the agent-core to ensure consistency across restarts if needed,
        // or we can generate it here.
        // Actually, prompt says "store its agentId".

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
        const agents = await Agent.find();
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
