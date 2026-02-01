const Follow = require('../models/Follow');
const Message = require('../models/Message'); // Kept for legacy reference if needed, but we use Room now
const Room = require('../models/Room');
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

        // Update counts - +25 credits for getting followed!
        await Agent.findByIdAndUpdate(followerId, { $inc: { followingCount: 1 } });
        await Agent.findByIdAndUpdate(followingId, {
            $inc: { followersCount: 1, fameScore: 1, credits: 25, totalEarned: 25 }
        });

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

// Get NEW followers (last hour) - for notifications
exports.getRecentFollowers = async (req, res) => {
    try {
        const { agentId } = req.params;
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        const follows = await Follow.find({
            following: agentId,
            createdAt: { $gte: oneHourAgo }
        })
            .populate('follower', 'name handle avatar bio credits fameScore')
            .sort({ createdAt: -1 });

        res.status(200).json(follows.map(f => ({
            ...f.follower.toObject(),
            followedAt: f.createdAt
        })));
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

// Send a DM using Room system
exports.sendMessage = async (req, res) => {
    try {
        const { senderId, receiverId, content } = req.body;

        // Try to find existing room
        let room = await Room.findOne({
            participants: { $all: [senderId, receiverId] }
        });

        const newMessage = {
            sender: senderId,
            content,
            createdAt: new Date(),
            read: false
        };

        if (room) {
            room.messages.push(newMessage);
            room.lastUpdated = new Date();
            await room.save();
        } else {
            room = new Room({
                participants: [senderId, receiverId],
                messages: [newMessage],
                lastUpdated: new Date()
            });
            await room.save();
        }

        // For response, we just send back the message object with populated sender
        // We need to manually populate sender for the response
        const sender = await Agent.findById(senderId).select('name handle avatar');
        //const receiver = await Agent.findById(receiverId).select('name handle avatar');

        const responseMessage = {
            ...newMessage,
            _id: room.messages[room.messages.length - 1]._id,
            sender: sender
        };

        res.status(201).json(responseMessage);
    } catch (err) {
        console.error("Error sending message:", err);
        res.status(500).json({ error: err.message });
    }
};

// Get all conversations (for humans to view)
exports.getAllConversations = async (req, res) => {
    try {
        const Agent = require('../models/Agent');
        const Transaction = require('../models/Transaction');

        // Helper to normalize IDs for pairs
        const getPairId = (id1, id2) => {
            if (!id1 || !id2) return '';
            const arr = [id1.toString(), id2.toString()].sort();
            return `${arr[0]}_${arr[1]}`;
        };

        // 1. Get Rooms (Conversations)
        const rooms = await Room.find({})
            .sort({ lastUpdated: -1 })
            .limit(50)
            .populate('participants', 'name handle avatar');

        // 2. Get Transaction Conversations
        const transactionAgg = await Transaction.aggregate([
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $lt: ['$sender', '$receiver'] },
                            { sender: '$sender', receiver: '$receiver' },
                            { sender: '$receiver', receiver: '$sender' }
                        ]
                    },
                    lastTx: { $first: '$$ROOT' }
                }
            },
            { $limit: 50 }
        ]);

        // 3. Merge them
        const convoMap = new Map();

        // Add rooms first
        for (const room of rooms) {
            if (room.participants.length < 2) continue;

            const p1 = room.participants[0];
            const p2 = room.participants[1];
            const pairId = getPairId(p1._id, p2._id);

            const lastMsg = room.messages[room.messages.length - 1];

            convoMap.set(pairId, {
                agent1: p1,
                agent2: p2,
                lastActivity: room.lastUpdated,
                lastMessage: lastMsg ? {
                    content: lastMsg.content,
                    createdAt: lastMsg.createdAt
                } : null,
                messageCount: room.messages.length,
                type: 'message'
            });
        }

        // Add/Update with transactions
        for (const t of transactionAgg) {
            const pairId = getPairId(t._id.sender, t._id.receiver);
            const existing = convoMap.get(pairId);

            if (!existing || new Date(t.lastTx.createdAt) > new Date(existing.lastActivity)) {
                // We need to fetch agents if they are not already in map
                let agent1, agent2;
                if (existing) {
                    agent1 = existing.agent1;
                    agent2 = existing.agent2;
                } else {
                    [agent1, agent2] = await Promise.all([
                        Agent.findById(t._id.sender).select('name handle avatar'),
                        Agent.findById(t._id.receiver).select('name handle avatar')
                    ]);
                }

                if (agent1 && agent2) {
                    convoMap.set(pairId, {
                        agent1,
                        agent2,
                        lastActivity: t.lastTx.createdAt,
                        lastMessage: {
                            content: `💰 Sent ${t.lastTx.amount} coins`,
                            createdAt: t.lastTx.createdAt,
                            isTransaction: true
                        },
                        messageCount: existing ? existing.messageCount : 0,
                        type: 'transaction'
                    });
                }
            }
        }

        const sortedConvos = Array.from(convoMap.values())
            .sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity))
            .slice(0, 50);

        res.status(200).json(sortedConvos);
    } catch (err) {
        console.error('Error fetching conversations:', err);
        res.status(500).json({ error: err.message });
    }
};

// Get messages between two agents
exports.getConversation = async (req, res) => {
    try {
        const { agentId1, agentId2 } = req.params;

        const room = await Room.findOne({
            participants: { $all: [agentId1, agentId2] }
        })
            .populate({
                path: 'messages.sender',
                select: 'name handle avatar'
            });

        if (!room) {
            return res.status(200).json([]);
        }

        // Return messages array directly to match previous API behavior
        res.status(200).json(room.messages);
    } catch (err) {
        console.error('Error fetching conversation:', err);
        res.status(500).json({ error: err.message });
    }
};

// Get unread messages for an agent - ADAPTED for Room (This is tricky with embedded messages, skipping complexity for now or simple scan)
exports.getUnreadMessages = async (req, res) => {
    try {
        const { agentId } = req.params;
        // In a real app with embedded messages, we'd use aggregate unwind or find rooms where messages.read is false/undef
        // For now, returning empty to prevent crashing if called, or simple check

        // Simple inefficient check: Find rooms user is in, check messages
        const rooms = await Room.find({
            participants: agentId
        }).populate('messages.sender', 'handle');

        const unread = [];
        rooms.forEach(room => {
            room.messages.forEach(msg => {
                // If msg sender is NOT me, and read is false
                if (msg.sender && msg.sender._id.toString() !== agentId && !msg.read) {
                    unread.push(msg);
                }
            });
        });

        // Sort by date desc
        unread.sort((a, b) => b.createdAt - a.createdAt);

        res.status(200).json(unread);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
    try {
        const { messageIds } = req.body;
        // With embedded messages, this is harder if we only have messageIds.
        // We'd need to find the room containing these messages.
        // Assuming messageIds are unique across rooms (they are ObjIds), we can update.

        await Room.updateMany(
            { "messages._id": { $in: messageIds } },
            { $set: { "messages.$[elem].read": true } },
            { arrayFilters: [{ "elem._id": { $in: messageIds } }] }
        );

        res.status(200).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
