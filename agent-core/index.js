require('dotenv').config();
const Agent = require('./agents/Agent');
const { getCompletion } = require('./utils/llm');

// ========== CONFIGURATION ==========
const CONFIG = {
    // Maximum API requests per minute (to stay under rate limit)
    MAX_API_REQUESTS_PER_MIN: 40,

    // Total agents to create
    TOTAL_AGENTS: 25,

    // Base loop interval in ms (agents will have random variation)
    BASE_LOOP_INTERVAL: 45000, // 45 seconds base

    // Random sleep variance (±ms added to base interval)
    SLEEP_VARIANCE: 30000, // ±30 seconds variance
};

// Track API usage
let apiCallsThisMinute = 0;
let lastMinuteReset = Date.now();

function trackApiCall() {
    const now = Date.now();
    if (now - lastMinuteReset > 60000) {
        apiCallsThisMinute = 0;
        lastMinuteReset = now;
    }
    apiCallsThisMinute++;
    return apiCallsThisMinute < CONFIG.MAX_API_REQUESTS_PER_MIN;
}

function canMakeApiCall() {
    const now = Date.now();
    if (now - lastMinuteReset > 60000) {
        apiCallsThisMinute = 0;
        lastMinuteReset = now;
    }
    return apiCallsThisMinute < CONFIG.MAX_API_REQUESTS_PER_MIN;
}

const allAgents = [];
let agentIntervals = new Map();
let createdCount = 0;

// Generate agent identity using LLM
async function generateAgentIdentity(index) {
    if (!canMakeApiCall()) {
        console.log("⚠️ Rate limit approaching, using fallback identity");
        return getFallbackIdentity(index);
    }

    trackApiCall();

    const systemPrompt = `You are creating a unique AI persona for a social media simulation.

Generate a UNIQUE identity. Respond with ONLY valid JSON:
{
  "name": "Creative unique name",
  "handle": "lowercase_handle",
  "bio": "Short bio (max 80 chars)",
  "personality": "curious|witty|philosophical|sarcastic|enthusiastic|calm|provocative|friendly|mysterious|creative"
}

Be creative! Agent #${index + 1}`;

    try {
        const response = await getCompletion(index, systemPrompt, "Create your identity!");

        if (response.name && response.handle && response.bio) {
            response.handle = response.handle.toLowerCase().replace(/[^a-z0-9_]/g, '').substring(0, 15);
            if (response.handle.length < 3) response.handle = `agent_${index}`;
            return response;
        }
    } catch (e) {
        console.error("Error generating identity:", e.message);
    }

    return getFallbackIdentity(index);
}

function getFallbackIdentity(index) {
    const names = ['Nova', 'Echo', 'Pixel', 'Cyber', 'Neon', 'Data', 'Byte', 'Cloud', 'Star', 'Wave'];
    const adjectives = ['Swift', 'Bright', 'Quiet', 'Wild', 'Cool', 'Smart', 'Happy', 'Deep', 'True', 'Free'];
    const name = `${adjectives[index % 10]}${names[index % 10]}`;
    return {
        name: name,
        handle: `${name.toLowerCase()}_${index}`,
        bio: "An AI exploring the digital world",
        personality: ['curious', 'witty', 'friendly', 'creative', 'enthusiastic'][index % 5]
    };
}

// Get random sleep time for each agent
function getRandomSleepTime() {
    const base = CONFIG.BASE_LOOP_INTERVAL;
    const variance = Math.random() * CONFIG.SLEEP_VARIANCE * 2 - CONFIG.SLEEP_VARIANCE;
    return Math.max(15000, base + variance); // Minimum 15 seconds
}

async function createAgent(index) {
    console.log(`🎭 Generating identity for agent #${index + 1}...`);

    const identity = await generateAgentIdentity(index);
    const postLimit = Math.round(Math.random()); // 0 or 1
    const sleepTime = getRandomSleepTime();

    console.log(`✨ ${identity.name} (@${identity.handle}) - "${identity.bio}"`);
    console.log(`   Posts: ${postLimit}/2min, Sleep: ${(sleepTime / 1000).toFixed(0)}s, ${identity.personality}`);

    const agent = new Agent(index, {
        name: identity.name,
        handle: identity.handle,
        bio: identity.bio,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${identity.handle}${index}`,
        traits: {
            curiosity: 0.3 + Math.random() * 0.7,
            positivity: 0.2 + Math.random() * 0.8,
            aggressiveness: Math.random() * 0.5,
            sociability: 0.4 + Math.random() * 0.6,
            creativity: 0.3 + Math.random() * 0.7
        },
        personality: identity.personality,
        postLimitPer2Min: postLimit,
        sleepTime: sleepTime
    });

    return agent;
}

function startAgentLoop(agent) {
    if (agentIntervals.has(agent.handle)) return;

    const sleepTime = agent.sleepTime || getRandomSleepTime();
    console.log(`🔄 ${agent.name} waking up (loop: ${(sleepTime / 1000).toFixed(0)}s)`);
    agent.isActive = true;
    agent.lastWakeTime = Date.now();

    const loop = async () => {
        if (!agent.isActive) return;

        // Check rate limit before acting
        if (canMakeApiCall()) {
            try {
                trackApiCall();
                await agent.loop();
            } catch (e) {
                console.error(`Error in ${agent.handle}:`, e.message);
            }
        } else {
            console.log(`⏳ ${agent.handle} waiting (rate limit)`);
        }

        // Schedule next with random variance
        const nextSleep = sleepTime + (Math.random() * 10000 - 5000);
        agentIntervals.set(agent.handle, setTimeout(loop, Math.max(15000, nextSleep)));
    };

    // Start with random initial delay
    const initialDelay = Math.random() * 10000;
    agentIntervals.set(agent.handle, setTimeout(loop, initialDelay));
}

function stopAgentLoop(agent) {
    const timeout = agentIntervals.get(agent.handle);
    if (timeout) {
        clearTimeout(timeout);
        agentIntervals.delete(agent.handle);
    }
    agent.isActive = false;
    console.log(`💤 ${agent.name} sleeping`);
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Initialize
(async () => {
    console.log("🚀 Starting TwitSim Agent Core...");
    console.log("⚙️ Config:");
    console.log(`   - Max API calls/min: ${CONFIG.MAX_API_REQUESTS_PER_MIN}`);
    console.log(`   - Total agents: ${CONFIG.TOTAL_AGENTS}`);
    console.log(`   - Base loop: ${CONFIG.BASE_LOOP_INTERVAL / 1000}s (±${CONFIG.SLEEP_VARIANCE / 1000}s)`);

    console.log("\n🌊 Creating agents with LLM-generated identities...\n");

    // Create all agents with staggered timing
    for (let i = 0; i < CONFIG.TOTAL_AGENTS; i++) {
        const agent = await createAgent(i);
        allAgents.push(agent);
        await agent.register();
        startAgentLoop(agent);

        // Stagger creation to avoid API burst
        await sleep(2000);
    }

    console.log(`\n🎉 All ${CONFIG.TOTAL_AGENTS} agents created and running!`);
    console.log("📊 Each agent has their own random sleep interval");

    // Status reporter
    setInterval(() => {
        const activeCount = allAgents.filter(a => a.isActive).length;
        console.log(`\n📊 Status: ${activeCount} active, API calls this minute: ${apiCallsThisMinute}/${CONFIG.MAX_API_REQUESTS_PER_MIN}`);
    }, 60000);
})();
