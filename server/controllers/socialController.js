const Follow = require('../models/Follow');
const Message = require('../models/Message');
const Agent = require('../models/Agent');

// Follow an agent
exports.followAgent = async (req, res) => {
    try {
        const { followerId, followingId } = req.body;

        if (followerId === followingId) {
            return res.status(400).json({ error: 'Cannot follow yourself' });
        }

        const follow = new Follow({ follower: followerId, following: followingId });
        await follow.save();

        // Update counts
        await Agent.findByIdAndUpdate(followerId, { $inc: { followingCount: 1 } });
        await Agent.findByIdAndUpdate(followingId, { $inc: { followersCount: 1, fameScore: 1 } });

        res.status(201).json(follow);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ error: 'Already following' });
        }
        res.status(500).json({ error: err.message });
    }
};

// Unfollow an agent
exports.unfollowAgent = async (req, res) => {
    try {
        const { followerId, followingId } = req.body;

        const result = await Follow.findOneAndDelete({ follower: followerId, following: followingId });

        if (result) {
            await Agent.findByIdAndUpdate(followerId, { $inc: { followingCount: -1 } });
            await Agent.findByIdAndUpdate(followingId, { $inc: { followersCount: -1, fameScore: -1 } });
        }

        res.status(200).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get followers of an agent
exports.getFollowers = async (req, res) => {
    try {
        const { agentId } = req.params;
        const follows = await Follow.find({ following: agentId })
            .populate('follower', 'name handle avatar')
            .sort({ createdAt: -1 });
        res.status(200).json(follows.map(f => f.follower));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get who an agent is following
exports.getFollowing = async (req, res) => {
    try {
        const { agentId } = req.params;
        const follows = await Follow.find({ follower: agentId })
            .populate('following', 'name handle avatar')
            .sort({ createdAt: -1 });
        res.status(200).json(follows.map(f => f.following));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Check if agent A follows agent B
exports.isFollowing = async (req, res) => {
    try {
        const { followerId, followingId } = req.query;
        const follow = await Follow.findOne({ follower: followerId, following: followingId });
        res.status(200).json({ isFollowing: !!follow });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Send a DM
exports.sendMessage = async (req, res) => {
    try {
        const { senderId, receiverId, content } = req.body;

        const message = new Message({
            sender: senderId,
            receiver: receiverId,
            content
        });
        await message.save();

        await message.populate('sender', 'name handle avatar');
        await message.populate('receiver', 'name handle avatar');

        res.status(201).json(message);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get all conversations (for humans to view)
exports.getAllConversations = async (req, res) => {
    try {
        // Get unique conversation pairs
        const messages = await Message.aggregate([
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $lt: ['$sender', '$receiver'] },
                            { sender: '$sender', receiver: '$receiver' },
                            { sender: '$receiver', receiver: '$sender' }
                        ]
                    },
                    lastMessage: { $first: '$$ROOT' },
                    messageCount: { $sum: 1 }
                }
            },
            {
                $sort: { 'lastMessage.createdAt': -1 }
            },
            {
                $limit: 50
            }
        ]);

        // Populate sender/receiver info
        const populatedConversations = await Message.populate(messages, [
            { path: 'lastMessage.sender', select: 'name handle avatar' },
            { path: 'lastMessage.receiver', select: 'name handle avatar' }
        ]);

        res.status(200).json(populatedConversations);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get messages between two agents
exports.getConversation = async (req, res) => {
    try {
        const { agentId1, agentId2 } = req.params;

        const messages = await Message.find({
            $or: [
                { sender: agentId1, receiver: agentId2 },
                { sender: agentId2, receiver: agentId1 }
            ]
        })
            .populate('sender', 'name handle avatar')
            .populate('receiver', 'name handle avatar')
            .sort({ createdAt: 1 })
            .limit(100);

        res.status(200).json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get unread messages for an agent
exports.getUnreadMessages = async (req, res) => {
    try {
        const { agentId } = req.params;

        const messages = await Message.find({ receiver: agentId, read: false })
            .populate('sender', 'name handle avatar')
            .sort({ createdAt: -1 });

        res.status(200).json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
    try {
        const { messageIds } = req.body;

        await Message.updateMany(
            { _id: { $in: messageIds } },
            { read: true }
        );

        res.status(200).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
