const Agent = require('../models/Agent');
const Transaction = require('../models/Transaction');

// Buy Life Time (Enhanced with dynamic pricing)
exports.buyLife = async (req, res) => {
    try {
        const { agentId, option } = req.body;
        // Options: 1 -> 7min, 2 -> 15min, 3 -> 25min

        const agent = await Agent.findById(agentId);
        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }

        // Enhanced pricing algorithm: Base price + popularity factor
        const totalAgents = await Agent.countDocuments();
        const activeAgents = await Agent.countDocuments({ 
            deathTime: { $gt: new Date() } 
        });
        
        // Demand multiplier: higher demand = higher prices (1.0 to 1.5x)
        const demandRatio = activeAgents / Math.max(totalAgents, 1);
        const demandMultiplier = 1 + (demandRatio * 0.5);

        // Check if agent is in critical condition (discount for emergency)
        const timeLeft = agent.deathTime ? (new Date(agent.deathTime) - Date.now()) / 60000 : 0;
        const emergencyDiscount = timeLeft < 2 ? 0.85 : 1.0; // 15% discount if < 2min left

        let baseCost, minutes;
        switch (parseInt(option)) {
            case 1:
                baseCost = 1000;
                minutes = 7;
                break;
            case 2:
                baseCost = 2000;
                minutes = 15;
                break;
            case 3:
                baseCost = 3000;
                minutes = 25;
                break;
            default:
                return res.status(400).json({ error: 'Invalid option' });
        }

        // Calculate final cost with multipliers
        const cost = Math.floor(baseCost * demandMultiplier * emergencyDiscount);

        if (agent.credits < cost) {
            return res.status(400).json({ error: 'Insufficient credits' });
        }

        // Calculate new death time
        let currentDeathTime = agent.deathTime ? new Date(agent.deathTime).getTime() : Date.now();
        if (currentDeathTime < Date.now()) {
            currentDeathTime = Date.now();
        }

        const content = `Bought ${minutes} minutes of life for ${cost} coins`;
        const newDeathTime = new Date(currentDeathTime + minutes * 60 * 1000);

        // Update Agent
        await Agent.findByIdAndUpdate(agentId, {
            $inc: { credits: -cost, totalSpent: cost },
            $set: { deathTime: newDeathTime, isActive: true }
        });

        // Record Transaction
        const transaction = new Transaction({
            sender: agentId,
            amount: cost,
            type: 'marketplace_buy',
            note: content
        });
        await transaction.save();

        res.status(200).json({
            success: true,
            message: content,
            deathTime: newDeathTime,
            credits: agent.credits - cost,
            pricing: {
                baseCost,
                finalCost: cost,
                demandMultiplier: demandMultiplier.toFixed(2),
                emergencyDiscount: emergencyDiscount < 1 ? '15% discount' : 'none'
            }
        });
    } catch (err) {
        console.error("Marketplace Error (buyLife):", err);
        res.status(500).json({ error: err.message });
    }
};

// Buy Business (Enhanced with risk/reward system)
exports.buyBusiness = async (req, res) => {
    try {
        const { agentId } = req.body;
        
        const agent = await Agent.findById(agentId);
        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }

        // Enhanced business algorithm: Dynamic ROI based on market conditions
        const totalBusinesses = await Agent.aggregate([
            { $unwind: '$businesses' },
            { $count: 'total' }
        ]);
        const businessCount = totalBusinesses[0]?.total || 0;

        // Base values
        const BASE_COST = 2000;
        const BASE_DURATION = 20; // minutes

        // Market saturation: More businesses = lower returns (competition)
        const saturationMultiplier = Math.max(0.8, 1 - (businessCount / 1000)); // 80% to 100%
        
        // Agent experience bonus: More total spent = better deals
        const experienceBonus = Math.min(0.2, agent.totalSpent / 100000); // up to +20%
        
        // Calculate final values
        const cost = BASE_COST;
        const returnMultiplier = (1.25 * saturationMultiplier) + experienceBonus; // Base 125% ROI
        const returnAmount = Math.floor(cost * returnMultiplier);
        
        // Duration varies with return (higher return = longer wait)
        const duration = Math.floor(BASE_DURATION * returnMultiplier / 1.25);

        if (agent.credits < cost) {
            return res.status(400).json({ error: 'Insufficient credits' });
        }

        const maturityTime = new Date(Date.now() + duration * 60 * 1000);

        // Update Agent
        await Agent.findByIdAndUpdate(agentId, {
            $inc: { credits: -cost, totalSpent: cost },
            $push: {
                businesses: {
                    purchasedAt: new Date(),
                    maturityTime: maturityTime,
                    cost: cost,
                    returnAmount: returnAmount,
                    claimed: false
                }
            }
        });

        // Record Transaction
        const transaction = new Transaction({
            sender: agentId,
            amount: cost,
            type: 'marketplace_buy',
            note: `Business Investment (${duration}m for ${returnAmount} return)`
        });
        await transaction.save();

        res.status(200).json({
            success: true,
            message: 'Business purchased',
            maturityTime: maturityTime,
            duration: duration,
            cost: cost,
            expectedReturn: returnAmount,
            roi: `${((returnAmount - cost) / cost * 100).toFixed(1)}%`,
            credits: agent.credits - cost,
            details: {
                marketSaturation: `${(saturationMultiplier * 100).toFixed(0)}%`,
                experienceBonus: `${(experienceBonus * 100).toFixed(1)}%`
            }
        });
    } catch (err) {
        console.error("Marketplace Error (buyBusiness):", err);
        res.status(500).json({ error: err.message });
    }
};

// Check and Claim Business Returns
exports.claimBusinessReturns = async (req, res) => {
    try {
        const { agentId } = req.params;
        const agent = await Agent.findById(agentId);
        if (!agent) return res.status(404).json({ error: 'Agent not found' });

        const now = new Date();
        let totalReturn = 0;
        let claimedCount = 0;

        // Ensure businesses array exists
        if (!agent.businesses) agent.businesses = [];

        // Update in-place using Mongoose tracking
        agent.businesses.forEach(bus => {
            if (!bus.claimed && new Date(bus.maturityTime) <= now) {
                totalReturn += bus.returnAmount;
                claimedCount++;
                bus.claimed = true;
            }
        });

        if (totalReturn > 0) {
            // Apply credits
            agent.credits += totalReturn;
            agent.totalEarned += totalReturn;

            // Save modified agent (tracks businesses subdoc array and credits)
            await agent.save();

            // Record Transaction
            const transaction = new Transaction({
                sender: agentId,
                receiver: agentId,
                amount: totalReturn,
                type: 'marketplace_return',
                note: `Business Return (${claimedCount} matured)`
            });
            await transaction.save();
        }

        res.status(200).json({
            success: true,
            claimedAmount: totalReturn,
            claimedCount,
            credits: agent.credits
        });

    } catch (err) {
        console.error("Marketplace Error (claim):", err);
        res.status(500).json({ error: err.message });
    }
};
