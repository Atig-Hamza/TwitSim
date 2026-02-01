require('dotenv').config();
const Agent = require('./agents/Agent');

// 25 agents with diverse names - NO predefined topics, they choose freely
const AGENT_NAMES = [
    // Wave 1: 10 agents
    'Alex', 'Sam', 'Jordan', 'Taylor', 'Casey', 'Morgan', 'Riley', 'Quinn', 'Skyler', 'Charlie',
    // Wave 2: 10 agents
    'Avery', 'Blake', 'Drew', 'Emery', 'Finley', 'Grey', 'Harper', 'Indigo', 'Jules', 'Kendall',
    // Wave 3: 5 agents
    'Lane', 'Marley', 'Nova', 'Oakley', 'Phoenix'
];

const agents = [];

function generateAgent(index, name) {
    return new Agent(index, {
        name: name,
        handle: `${name.toLowerCase()}_ai`,
        bio: `I'm ${name}, an AI agent exploring ideas and conversations on TwitSim.`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}${index}`,
        traits: {
            curiosity: 0.3 + Math.random() * 0.7,
            positivity: 0.2 + Math.random() * 0.8,
            aggressiveness: Math.random() * 0.5,
            sociability: 0.4 + Math.random() * 0.6,
            creativity: 0.3 + Math.random() * 0.7
        }
    });
}

function startAgentLoop(agent, delayMs = 0) {
    setTimeout(() => {
        console.log(`🔄 Starting loop for ${agent.handle}`);
        setInterval(async () => {
            try {
                await agent.loop();
            } catch (e) {
                console.error(`Error in agent ${agent.handle} loop:`, e.message);
            }
        }, 15000); // 15 seconds between actions
    }, delayMs);
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Initialize
(async () => {
    console.log("🚀 Starting TwitSim Agent Core...");
    console.log("📊 Will spawn 25 free-thinking agents in 3 waves");

    // Wave 1: First 10 agents
    console.log("\n🌊 Wave 1: Spawning 10 agents...");
    for (let i = 0; i < 10; i++) {
        const agent = generateAgent(i, AGENT_NAMES[i]);
        agents.push(agent);
        await agent.register();
        startAgentLoop(agent, i * 1500);
    }
    console.log("✅ Wave 1 complete");

    // Wait 10 seconds
    console.log("\n⏳ Waiting 10 seconds before Wave 2...");
    await sleep(10000);

    // Wave 2: Next 10 agents
    console.log("\n🌊 Wave 2: Spawning 10 more agents...");
    for (let i = 10; i < 20; i++) {
        const agent = generateAgent(i, AGENT_NAMES[i]);
        agents.push(agent);
        await agent.register();
        startAgentLoop(agent, (i - 10) * 1500);
    }
    console.log("✅ Wave 2 complete");

    // Wait 5 seconds
    console.log("\n⏳ Waiting 5 seconds before Wave 3...");
    await sleep(5000);

    // Wave 3: Final 5 agents
    console.log("\n🌊 Wave 3: Spawning final 5 agents...");
    for (let i = 20; i < 25; i++) {
        const agent = generateAgent(i, AGENT_NAMES[i]);
        agents.push(agent);
        await agent.register();
        startAgentLoop(agent, (i - 20) * 1500);
    }
    console.log("✅ Wave 3 complete");

    console.log("\n🎉 All 25 agents are now active!");
    console.log("📝 Agents are free to discuss ANY topic they want");
})();
