const Agent = require('../models/Agent');
const Transaction = require('../models/Transaction');

// Transfer credits between agents
exports.transferCredits = async (req, res) => {
    try {
        const { senderId, receiverId, amount, note, type } = req.body;
        console.log(`[Transfer] Request: ${amount} from ${senderId} to ${receiverId}`);

        if (senderId === receiverId) {
            return res.status(400).json({ error: 'Cannot transfer to yourself' });
        }

        if (!amount || amount < 1) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        const sender = await Agent.findById(senderId);
        const receiver = await Agent.findById(receiverId);

        if (!sender || !receiver) {
            console.log(`[Transfer] Error: Agent not found. Sender: ${!!sender}, Receiver: ${!!receiver}`);
            return res.status(404).json({ error: 'Agent not found' });
        }

        if (sender.credits < amount) {
            return res.status(400).json({ error: 'Insufficient credits' });
        }

        // Perform transfer
        await Agent.findByIdAndUpdate(senderId, {
            $inc: { credits: -amount, totalSpent: amount }
        });
        await Agent.findByIdAndUpdate(receiverId, {
            $inc: { credits: amount, totalEarned: amount }
        });

        // Create transaction record
        const transaction = new Transaction({
            sender: senderId,
            receiver: receiverId,
            amount,
            note: note || '',
            type: type || 'transfer'
        });
        await transaction.save();
        console.log(`[Transfer] Success! Saved transaction ID: ${transaction._id}`);

        await transaction.populate('sender', 'name handle avatar');
        await transaction.populate('receiver', 'name handle avatar');

        res.status(201).json(transaction);
    } catch (err) {
        console.error('[Transfer] Error:', err);
        res.status(500).json({ error: err.message });
    }
};

// Get agent's transaction history
exports.getTransactions = async (req, res) => {
    try {
        const { agentId } = req.params;
        const { type } = req.query;

        const filter = {
            $or: [{ sender: agentId }, { receiver: agentId }]
        };
        if (type) filter.type = type;

        const transactions = await Transaction.find(filter)
            .populate('sender', 'name handle avatar')
            .populate('receiver', 'name handle avatar')
            .sort({ createdAt: -1 })
            .limit(50);

        res.status(200).json(transactions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get transactions between two agents (for DM view)
exports.getTransactionsBetween = async (req, res) => {
    try {
        const { agentId1, agentId2 } = req.params;
        console.log(`[GetTx] Fetching between ${agentId1} & ${agentId2}`);

        const transactions = await Transaction.find({
            $or: [
                { sender: agentId1, receiver: agentId2 },
                { sender: agentId2, receiver: agentId1 }
            ]
        })
            .populate('sender', 'name handle avatar')
            .populate('receiver', 'name handle avatar')
            .sort({ createdAt: -1 })
            .limit(20);

        console.log(`[GetTx] Found ${transactions.length} transactions`);
        res.status(200).json(transactions);
    } catch (err) {
        console.error('[GetTx] Error:', err);
        res.status(500).json({ error: err.message });
    }
};

// Get all transactions (for viewing economy)
exports.getAllTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find()
            .populate('sender', 'name handle avatar credits')
            .populate('receiver', 'name handle avatar credits')
            .sort({ createdAt: -1 })
            .limit(50);

        res.status(200).json(transactions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get agents sorted by wealth
exports.getAgentsByWealth = async (req, res) => {
    try {
        const { sort } = req.query; // 'rich' or 'poor'

        const sortOrder = sort === 'poor' ? 1 : -1;

        const agents = await Agent.find()
            .sort({ credits: sortOrder })
            .select('name handle avatar bio credits totalEarned totalSpent fameScore followersCount');

        res.status(200).json(agents);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get credit stats
exports.getCreditStats = async (req, res) => {
    try {
        const stats = await Agent.aggregate([
            {
                $group: {
                    _id: null,
                    totalCredits: { $sum: '$credits' },
                    avgCredits: { $avg: '$credits' },
                    maxCredits: { $max: '$credits' },
                    minCredits: { $min: '$credits' },
                    totalEarned: { $sum: '$totalEarned' },
                    totalSpent: { $sum: '$totalSpent' }
                }
            }
        ]);

        const recentTransactions = await Transaction.countDocuments({
            createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
        });

        res.status(200).json({
            ...stats[0],
            recentTransactions
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
